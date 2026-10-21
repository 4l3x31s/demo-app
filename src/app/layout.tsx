import type { Metadata } from "next";
import { APP_NAME } from "../lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} | Demo del patrón Factory`,
  description: "Demostración de notificaciones simuladas con Next.js y el patrón Factory.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
