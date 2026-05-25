import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universidad Veracruzana | AI Academic Reviewer",
  description:
    "Plataforma inteligente para revisión académica, análisis documental y arbitraje científico asistido por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
