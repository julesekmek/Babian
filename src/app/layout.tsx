import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Babian | Bourse à Boissons",
  description: "Transformez votre bar en bourse en temps réel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased bg-black">
        {children}
      </body>
    </html>
  );
}
