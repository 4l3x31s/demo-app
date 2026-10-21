/** El nombre público es opcional; una configuración vacía conserva la demo utilizable. */
export function resolveAppName(value: string | undefined): string {
  return value?.trim() || "Centro de notificaciones";
}

export const APP_NAME = resolveAppName(process.env.NEXT_PUBLIC_APP_NAME);
