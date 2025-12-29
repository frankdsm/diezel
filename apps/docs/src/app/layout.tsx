import type { LayoutProps } from "diezel";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnchorIcon } from "@hugeicons/core-free-icons";
import "./globals.css";

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Diezel - The React Framework for the Modern Web</title>
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <div className="relative">
          <div className="relative max-w-6xl mx-auto px-6">
            <header className="py-6">
              <nav className="flex items-center justify-between">
                <a
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold tracking-tight"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-primary">
                    <HugeiconsIcon icon={AnchorIcon} size={18} />
                  </div>
                  Diezel
                </a>
                <div className="flex items-center gap-8 text-sm text-muted-foreground">
                  <a
                    href="/docs"
                    className="hover:text-foreground transition-colors"
                  >
                    Docs
                  </a>
                  <a
                    href="/examples"
                    className="hover:text-foreground transition-colors"
                  >
                    Examples
                  </a>
                  <a
                    href="https://github.com/frankdsm/diezel"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                  <Button asChild size="sm">
                    <a href="/docs">Get Started</a>
                  </Button>
                </div>
              </nav>
            </header>
            <main>{children}</main>
            <footer className="py-16 mt-32 border-t border-border">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-primary">
                    <HugeiconsIcon icon={AnchorIcon} size={14} />
                  </div>
                  <span>Diezel</span>
                </div>
                <div className="flex gap-8">
                  <a
                    href="/docs"
                    className="hover:text-foreground transition-colors"
                  >
                    Documentation
                  </a>
                  <a
                    href="https://github.com/frankdsm/diezel"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                  <a
                    href="https://twitter.com/diezel"
                    className="hover:text-foreground transition-colors"
                  >
                    Twitter
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
