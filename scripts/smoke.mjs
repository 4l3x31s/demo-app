import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

// Verifica un servidor de producción real en un puerto local temporal.
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { stdio: ["ignore", "pipe", "pipe"] });
let output = "";
server.stdout.on("data", (chunk) => { output = (output + chunk).slice(-3000); });
server.stderr.on("data", (chunk) => { output = (output + chunk).slice(-3000); });
server.on("error", (error) => { output = error.message; });

try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`El servidor se detuvo: ${output}`);
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(2000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Espera únicamente al servidor iniciado por esta comprobación. */ }
    await delay(250);
  }
  assert.ok(ready, `El servidor no estuvo disponible a tiempo: ${output}`);
  const page = await fetch(origin);
  const html = await page.text();
  assert.match(html, /Crear una notificación/);
  assert.match(html, /lang="es"/);
  assert.match(html, /Simular notificación/);
  assert.doesNotMatch(html, /Compose a notification|Simulation environment|Recent activity/);
  assert.match(html, /architecture.html/);
  console.log("CORRECTO: página en español, formulario y enlace a la arquitectura");

  const architecture = await fetch(`${origin}/architecture.html`);
  assert.equal(architecture.status, 200);
  const diagram = await architecture.text();
  assert.match(diagram, /Fábrica de notificadores/);
  assert.match(diagram, /Canales simulados/);
  console.log("CORRECTO: arquitectura de Archify en español disponible por HTTP");

  for (const [channel, recipient] of [["in-app", "usuario-demo"], ["email", "demo@example.com"], ["sms", "+59170000000"]]) {
    const response = await fetch(`${origin}/api/notifications`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, recipient, title: "Prueba de integración", message: "Envío simulado." }),
    });
    assert.equal(response.status, 201);
    const receipt = await response.json();
    assert.equal(receipt.channel, channel);
    assert.equal(receipt.status, "simulated");
    assert.equal(receipt.recipient, recipient);
    console.log(`CORRECTO: simulación HTTP del canal ${channel}`);
  }
  const invalid = await fetch(`${origin}/api/notifications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: "push" }) });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error, "Canal no admitido.");
  console.log("CORRECTO: solicitud inválida devuelve HTTP 400 y explicación en español");
  if (process.argv.includes("--browser")) {
    const { verifyNotificationDetails } = await import("./browser-smoke.mjs");
    await verifyNotificationDetails(origin);
  }
} finally {
  if (server.exitCode === null) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill();
    await exited;
  }
}
