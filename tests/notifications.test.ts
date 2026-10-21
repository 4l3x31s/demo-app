import assert from "node:assert/strict";
import { test } from "node:test";
import { NotificationFactory, EmailNotifier, SmsNotifier, InAppNotifier } from "../src/lib/notifications";
import { POST } from "../src/app/api/notifications/route";

const input = { recipient: "demo@example.com", title: "Proceso completado", message: "Su vista previa está lista." };
function request(body: unknown) {
  return new Request("http://localhost/api/notifications", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

test("La Factory crea el producto concreto de cada canal", () => {
  assert.ok(NotificationFactory.create("email") instanceof EmailNotifier);
  assert.ok(NotificationFactory.create("sms") instanceof SmsNotifier);
  assert.ok(NotificationFactory.create("in-app") instanceof InAppNotifier);
});

for (const channel of ["email", "sms", "in-app"] as const) {
  test(`POST ${channel} devuelve un comprobante simulado sin envío externo`, async () => {
    const recipient = channel === "sms" ? "+59170000000" : channel === "in-app" ? "demo-user" : input.recipient;
    const response = await POST(request({ ...input, recipient, channel }));
    assert.equal(response.status, 201);
    const receipt = await response.json();
    assert.equal(receipt.channel, channel);
    assert.equal(receipt.status, "simulated");
    assert.equal(receipt.recipient, recipient);
    assert.equal(receipt.title, input.title);
    assert.equal(receipt.message, input.message);
    assert.equal(receipt.provider, channel === "email" ? "Simulador de correo" : channel === "sms" ? "Simulador de SMS" : "Bandeja local simulada");
    assert.ok(receipt.id);
    assert.ok(Number.isFinite(Date.parse(receipt.createdAt)));
  });
}

test("POST rechaza canales no admitidos y datos inválidos", async () => {
  for (const body of [null, [], {}, { ...input, channel: "push" }, { ...input, channel: "email", recipient: "invalid" }, { ...input, channel: "sms", recipient: "abc" }, { ...input, channel: "in-app", title: " " }, { ...input, channel: "in-app", message: "x".repeat(1001) }]) {
    const response = await POST(request(body));
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, "string");
  }
});

test("POST rechaza JSON inválido con un mensaje en español", async () => {
  const response = await POST(new Request("http://localhost/api/notifications", { method: "POST", body: "{" }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "El cuerpo de la solicitud no contiene JSON válido.");
});

test("La Factory rechaza canales desconocidos en lugar de usar un valor predeterminado", () => {
  assert.throws(() => NotificationFactory.create("unsupported" as "email"), /Canal no admitido/);
});

test("La API explica los errores de validación en español y conserva HTTP 400", async () => {
  const cases: [unknown, string][] = [
    [null, "Se esperaba un objeto de notificación."],
    [{ ...input, channel: "push" }, "Canal no admitido."],
    [{ ...input, channel: "email", recipient: "incorrecto" }, "Ingrese una dirección de correo válida."],
    [{ ...input, channel: "sms", recipient: "incorrecto" }, "Use un número internacional, por ejemplo +59170000000."],
    [{ ...input, channel: "in-app", title: " " }, "El título debe contener entre 1 y 100 caracteres."],
  ];
  for (const [body, error] of cases) {
    const response = await POST(request(body));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error });
  }
});
