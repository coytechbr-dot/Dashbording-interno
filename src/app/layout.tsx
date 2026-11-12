import type { Metadata } from "next";
import Script from "next/script";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { CoyDashProvider } from "@/lib/coydash-store";
import { CoyDashShell } from "@/components/layout/coydash-shell";

const schibsted = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "coydash · Ecossistema Coytech",
  description: "Plataforma unificada de sistemas sob medida, automação com IA e monitoramento 24/7.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${schibsted.variable} h-full antialiased dark`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('dash-theme') || 'dark';
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <CoyDashProvider>
          <CoyDashShell>{children}</CoyDashShell>
        </CoyDashProvider>
      </body>
    </html>
  );
}
