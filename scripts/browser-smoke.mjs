import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

/** Prueba la interfaz pública con Chrome aislado, sin dependencias adicionales. */
export async function verifyNotificationDetails(origin) {
  assert.equal(typeof WebSocket, "function", "Esta prueba de navegador requiere Node.js 22 o posterior.");
  const chromePath = [
    join(process.env.PROGRAMFILES || "C:/Program Files", "Google/Chrome/Application/chrome.exe"),
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find(existsSync);
  assert.ok(chromePath, "No se encontró Chrome/Chromium; la prueba no se ejecutó.");
  const root = join(tmpdir(), "opencode");
  await mkdir(root, { recursive: true });
  const profile = await mkdtemp(join(root, "notificaciones-navegador-"));
  const browser = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-extensions", "--disable-sync", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  let stderr = "";
  browser.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-8000); });
  let spawnError;
  browser.on("error", (error) => { spawnError = error; });
  let socket;
  const pending = new Map();
  let nextId = 0;
  try {
    let endpoint;
    for (let attempt = 0; attempt < 80; attempt++) {
      if (spawnError) throw spawnError;
      endpoint = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
      if (endpoint) break;
      if (browser.exitCode !== null) throw new Error("Chrome se detuvo antes de iniciar la prueba.");
      await delay(100);
    }
    assert.ok(endpoint, "Chrome no expuso una conexión de prueba a tiempo.");
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      const entry = pending.get(message.id);
      if (!entry) return;
      clearTimeout(entry.timeout);
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result);
    });
    function command(method, params = {}, sessionId) {
      return new Promise((resolve, reject) => {
        const id = ++nextId;
        const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Tiempo agotado: ${method}`)); }, 10000);
        pending.set(id, { resolve, reject, timeout });
        socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      });
    }
    const { targetId } = await command("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await command("Target.attachToTarget", { targetId, flatten: true });
    async function evaluate(expression) {
      const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    }
    async function waitFor(expression) {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(expression)) return;
        await delay(100);
      }
      throw new Error(`No se cumplió la condición de interfaz: ${expression}`);
    }
    const unread = () => evaluate(`document.querySelector('[aria-label="Notificaciones sin leer"]')?.textContent`);
    await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
    await command("Page.navigate", { url: origin }, sessionId);
    await waitFor('document.querySelector("form button[type=submit]") && document.readyState === "complete"');
    // Esperar que el formulario esté disponible antes de activar su acción pública.
    await delay(200);
    for (let count = 1; count <= 2; count++) {
      await evaluate('document.querySelector("form").requestSubmit()');
      await waitFor(`document.querySelectorAll(".activity-list li").length === ${count} && !document.querySelector("fieldset").disabled`);
    }
    const hasOpenAction = await evaluate(`Boolean(document.querySelector('button[aria-label^="Abrir notificación:"]'))`);
    assert.ok(hasOpenAction, "Cada comprobante debe ofrecer una acción para abrir su notificación.");
    assert.equal(await unread(), "02");
    await evaluate(`document.querySelector('button[aria-label^="Abrir notificación:"]').click()`);
    await waitFor('document.querySelector("dialog")?.open');
    assert.equal(await unread(), "01", "Abrir una notificación no debe marcar las demás como leídas.");
    const details = await evaluate('document.querySelector("dialog").textContent');
    for (const value of ["Su espacio de trabajo está listo", "Todo está preparado para comenzar.", "usuario-demo", "Bandeja local simulada", "Simulada", "Identificador", "Fecha"]) assert.ok(details.includes(value), `Falta en el detalle: ${value}`);
    await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }, sessionId);
    await command("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }, sessionId);
    await waitFor('!document.querySelector("dialog")?.open && !document.querySelector(".detail-content")');
    await evaluate(`document.querySelectorAll('button[aria-label^="Abrir notificación:"]')[1].focus()`);
    assert.ok(await evaluate(`document.activeElement?.getAttribute('aria-label')?.startsWith('Abrir notificación:')`), "El botón debe recibir el foco antes de activarlo por teclado.");
    await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r", unmodifiedText: "\r" }, sessionId);
    await command("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }, sessionId);
    await waitFor('document.querySelector("dialog")?.open');
    assert.equal(await unread(), "00");
    await evaluate(`document.querySelector('dialog button[aria-label="Cerrar notificación"]').click()`);
    await waitFor('!document.querySelector("dialog")?.open && !document.querySelector(".detail-content")');
    // Dejar una notificación sin leer y abrir un correo: el contador no debe cambiar.
    await evaluate('document.querySelector("form").requestSubmit()');
    await waitFor('document.querySelectorAll(".activity-list li").length === 3 && !document.querySelector("fieldset").disabled');
    await evaluate('[...document.querySelectorAll(".channel")].find(button => button.textContent.includes("Correo")).click()');
    await evaluate('document.querySelector("form").requestSubmit()');
    await waitFor('document.querySelectorAll(".activity-list li").length === 4 && !document.querySelector("fieldset").disabled');
    await evaluate(`document.querySelector('button[aria-label^="Abrir notificación:"]').click()`);
    await waitFor('document.querySelector("dialog")?.open');
    assert.equal(await unread(), "01");
    assert.ok((await evaluate('document.querySelector("dialog").textContent')).includes("Simulador de correo"));
    await command("Input.dispatchMouseEvent", { type: "mousePressed", x: 2, y: 2, button: "left", clickCount: 1 }, sessionId);
    await command("Input.dispatchMouseEvent", { type: "mouseReleased", x: 2, y: 2, button: "left", clickCount: 1 }, sessionId);
    await waitFor('!document.querySelector("dialog")?.open && !document.querySelector(".detail-content")');
    console.log("CORRECTO: abrir detalle, lectura individual, teclado, Escape, botón de cierre y fondo exterior");
  } finally {
    for (const entry of pending.values()) clearTimeout(entry.timeout);
    socket?.close();
    if (browser.exitCode === null) {
      const exited = new Promise((resolve) => browser.once("exit", resolve));
      browser.kill();
      await exited;
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
  }
}
