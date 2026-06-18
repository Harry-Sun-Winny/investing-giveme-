import "./styles.css";
import type { ReactNode } from "react";
import LazyAiChat from "./components/LazyAiChat";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Investment Portfolio",
  description:
    "Portfolio, watchlist, goals, news, and sourced risk analysis",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn("dark font-sans", geist.variable)}
    >
      <body className="bg-slate-950 text-slate-100 antialiased">
        <TooltipProvider>
          {children}
          <LazyAiChat />
        </TooltipProvider>
      </body>
    </html>
  );
}
