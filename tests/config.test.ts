import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveAppName } from "../src/lib/config";

test("El nombre de la aplicación es opcional y usa un valor predeterminado", () => {
  assert.equal(resolveAppName(undefined), "Centro de notificaciones");
  assert.equal(resolveAppName("  "), "Centro de notificaciones");
});

test("La configuración admite un nombre personalizado sin espacios exteriores", () => {
  assert.equal(resolveAppName("  Notificaciones del equipo  "), "Notificaciones del equipo");
});
