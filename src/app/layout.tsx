import "../assets/css/globals.css"; // CSS is now included here
import { Toaster } from "react-hot-toast";
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
        <html lang="en">
          <head></head>
          <body suppressHydrationWarning className="antialiased">
            <Toaster position="top-center" reverseOrder={false} />
            {children}
          </body>
        </html>
      </AuthProvider>
    </Providers>
  );
}
