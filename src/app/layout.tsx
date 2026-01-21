import "../assets/css/globals.css"; // CSS is now included here
import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";
import Providers from "@/store/Providers";
import { AuthProvider } from "@/lib/supabase/context";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <Providers>
      <AuthProvider>
        <html lang="en" suppressHydrationWarning>
          <head>
            {/* Favicons served from /public/favicons */}
            <link rel="icon" href="/favicons/favicon.ico" sizes="any" />
            <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
            <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png" />
            <link rel="manifest" href="/favicons/site.webmanifest" />
            <meta name="theme-color" content="#002e6b" />
          </head>
          <body suppressHydrationWarning className="antialiased">
            <Toaster position="top-center" />
            {children}
          </body>
        </html>
      </AuthProvider>
    </Providers>
  );
}
