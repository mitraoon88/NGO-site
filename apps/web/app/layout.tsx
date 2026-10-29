import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, Parisienne, Noto_Sans_Oriya } from "next/font/google";
import "./globals.css";

/**
 * Three type voices, matching the mockup:
 *  - Newsreader  → serif display (headings, card titles, stat numerals)
 *  - Inter       → UI sans (nav, body, labels, buttons)
 *  - Parisienne  → monoline script (hero accent only)
 * If the client owns the original licensed faces, swap here and nowhere else.
 */
const display = Newsreader({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-a2-display",
});

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-a2-sans",
});

/**
 * Odia — the header's language switch shows `ଓଡ଼ିଆ`, and Inter's latin subset has
 * no glyphs for it, so without this face the label renders as tofu boxes. Used on
 * exactly one element (`lang="or"`), loaded at 400 only.
 */
const odia = Noto_Sans_Oriya({
  subsets: ["oriya"],
  display: "swap",
  weight: ["400"],
  variable: "--font-a2-odia",
});

const script = Parisienne({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-a2-script",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://a2foundation.org"),
  title: {
    default: "A2 Foundation — People · Planet · Possibility",
    template: "%s · A2 Foundation",
  },
  description:
    "A2 Foundation works with communities to create lasting change through education, health, livelihoods and a sustainable environment.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "A2 Foundation",
    url: "/",
    title: "A2 Foundation — People · Planet · Possibility",
    description:
      "Working with people and communities to build a more equitable, inclusive and sustainable tomorrow.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "A2 Foundation — a more equitable and sustainable tomorrow.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "A2 Foundation — People · Planet · Possibility",
    description:
      "Working with people and communities to build a more equitable, inclusive and sustainable tomorrow.",
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#11231B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${display.variable} ${sans.variable} ${script.variable} ${odia.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
