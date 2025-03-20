export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Strike CRM",
  description: "Customer Relationship Management system with advanced features",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Leads",
      href: "/leads",
    },
    {
      title: "Meetings",
      href: "/meetings",
    },
    {
      title: "Tasks",
      href: "/tasks",
    },
    {
      title: "Communications",
      href: "/communications",
    },
  ],
  links: {
    github: "https://github.com",
    docs: "/docs",
  },
} 