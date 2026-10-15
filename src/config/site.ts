export const siteConfig = {
  name: "Foundation",
  description: "A scalable Next.js application foundation.",
  nav: [
    { title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
    { title: "Files", href: "/files", icon: "folder" },
    { title: "Settings", href: "/settings", icon: "settings" },
  ],
} as const;

export type NavIcon = (typeof siteConfig.nav)[number]["icon"];
