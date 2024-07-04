import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/context/theme";
import { QuestContextProvider } from "@/components/context/quest";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "GrandQuestAuto",
  description:
    "We got GrandQuestAuto (GQA) before GTA 6!! GQA brings you a never-seen-before adventure, which we like to call a Techno Treasure Hunt.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://grandquest.vercel.app/"),
  icons: "/logo_black.svg",
  appleWebApp: {
    title: "GrandQuestAuto",
    statusBarStyle: "black-translucent",
    capable: true,
    startupImage: "/logo_black.png",
  },
};

const font = Comfortaa({ subsets: ["latin"], weight: ["400"] });
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Honk&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body className={cn(font.className, "h-[100dvh] select-none")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QuestContextProvider>
            <Toaster />
            {children}
          </QuestContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
