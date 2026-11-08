import { EB_Garamond, Inter } from "next/font/google";
import "./globals.css";

const displayFont = EB_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
});

const interfaceFont = Inter({
  variable: "--font-interface",
  subsets: ["latin"],
});

export const metadata = {
  title: "Utshob | Make room for a good time",
  description: "Discover events worth showing up for, or bring your people together with Utshob.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${interfaceFont.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
