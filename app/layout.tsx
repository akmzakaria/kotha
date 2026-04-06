import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import LayoutWrapper from "@/components/LayoutWrapper"
import { ToastProvider } from "@/components/ToastProvider"
import { ConfirmProvider } from "@/components/ConfirmProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Kothaa - Chat App",
  description: "A WhatsApp-like chat application",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.style.backgroundColor = theme === 'light' ? '#f8f9fa' : '#1A2421';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
        <link rel="prefetch" href="/chats" />
        <link rel="prefetch" href="/users" />
        <link rel="prefetch" href="/friends" />
        <link rel="prefetch" href="/requests" />
        <link rel="prefetch" href="/profile" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-base-100 text-base-content`}
      >
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <ProtectedRoute>
                <LayoutWrapper>{children}</LayoutWrapper>
              </ProtectedRoute>
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
