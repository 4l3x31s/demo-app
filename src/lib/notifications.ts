import { randomUUID } from "node:crypto";

export type Channel = "in-app" | "email" | "sms";
export type NotificationInput = { recipient: string; title: string; message: string };
export type NotificationReceipt = NotificationInput & {
  id: string;
  channel: Channel;
  status: "simulated";
  createdAt: string;
  provider: string;
};

/** Contrato del producto: el consumidor no depende de un canal concreto. */
export interface Notifier {
  send(input: NotificationInput): Promise<NotificationReceipt>;
}

abstract class SimulatedNotifier implements Notifier {
  abstract readonly channel: Channel;
  abstract readonly provider: string;

  async send(input: NotificationInput): Promise<NotificationReceipt> {
    // Sin llamadas de red: cada producto genera un comprobante explícitamente simulado.
    return { ...input, id: randomUUID(), channel: this.channel, provider: this.provider, status: "simulated", createdAt: new Date().toISOString() };
  }
}

export class InAppNotifier extends SimulatedNotifier {
  readonly channel = "in-app";
  readonly provider = "Bandeja local simulada";
}

export class EmailNotifier extends SimulatedNotifier {
  readonly channel = "email";
  readonly provider = "Simulador de correo";
}

export class SmsNotifier extends SimulatedNotifier {
  readonly channel = "sms";
  readonly provider = "Simulador de SMS";
}

/** Simple Factory: centraliza la selección sin acoplar la ruta a los constructores. */
export class NotificationFactory {
  static create(channel: Channel): Notifier {
    switch (channel) {
      case "in-app": return new InAppNotifier();
      case "email": return new EmailNotifier();
      case "sms": return new SmsNotifier();
      default: throw new Error("Canal no admitido.");
    }
  }
}

export function parseNotification(body: unknown): NotificationInput & { channel: Channel } {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Se esperaba un objeto de notificación.");
  const value = body as Record<string, unknown>;
  if (value.channel !== "in-app" && value.channel !== "email" && value.channel !== "sms") throw new Error("Canal no admitido.");
  function text(key: string, max: number, label: string): string {
    const field = value[key];
    if (typeof field !== "string" || !field.trim() || field.trim().length > max) throw new Error(`${label} debe contener entre 1 y ${max} caracteres.`);
    return field.trim();
  }
  const recipient = text("recipient", 254, "El destinatario");
  if (value.channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error("Ingrese una dirección de correo válida.");
  if (value.channel === "sms" && !/^\+[1-9]\d{7,14}$/.test(recipient)) throw new Error("Use un número internacional, por ejemplo +59170000000.");
  return { channel: value.channel, recipient, title: text("title", 100, "El título"), message: text("message", 1000, "El mensaje") };
}
