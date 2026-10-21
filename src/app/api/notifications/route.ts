import { NotificationFactory, parseNotification } from "../../../lib/notifications";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "El cuerpo de la solicitud no contiene JSON válido." }, { status: 400 });
  }
  let input: ReturnType<typeof parseNotification>;
  try {
    input = parseNotification(body);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "La notificación no es válida." }, { status: 400 });
  }
  try {
    const { channel, ...notification } = input;
    const notifier = NotificationFactory.create(channel);
    return Response.json(await notifier.send(notification), { status: 201 });
  } catch {
    return Response.json({ error: "No se pudo simular la notificación. Intente nuevamente." }, { status: 500 });
  }
}
