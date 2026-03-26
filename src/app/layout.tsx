import type { Metadata } from "next";
import { Chewy, Pacifico, Outfit } from "next/font/google";
import "./globals.css";

const chewy = Chewy({
  variable: "--font-chewy",
  weight: "400",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CapyPlanner - Maria's Private Space",
  description: "A magical interactive planner with Maria and her family.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${chewy.variable} ${pacifico.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-outfit">{children}</body>
    </html>
  );
}
