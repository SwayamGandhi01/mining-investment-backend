"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Handshake,
  Building2,
  FileText,
  Clock,
  Newspaper,
  Image as ImageIcon,
  ClipboardList,
  UserCircle,
  Settings,
  Store,
  X,
  ChevronLeft,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/admin/events", icon: Calendar },
  { label: "Brochures", href: "/admin/brochures", icon: FileText },
  { label: "Agendas", href: "/admin/agendas", icon: Clock },
  { label: "Speakers", href: "/admin/speakers", icon: Users },
  { label: "Sponsors", href: "/admin/sponsors", icon: Handshake },
  { label: "Exhibitors", href: "/admin/exhibitors", icon: Store },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Blogs", href: "/admin/blogs", icon: Newspaper },
  { label: "Gallery", href: "/admin/gallery", icon: ImageIcon },
  { label: "Registrations", href: "/admin/registrations", icon: ClipboardList },
  { label: "Users", href: "/admin/users", icon: UserCircle },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const [siteName, setSiteName] = useState<string>("InvestmentAdmin");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    axios.get("/api/settings").then((res) => {
      if (isMounted && res.data?.success && res.data?.data) {
        const data = res.data.data;
        if (data.siteName) setSiteName(data.siteName);
        if (data.logo?.url) setLogoUrl(data.logo.url);
        
        const fav = data.favicon?.url || data.logo?.url;
        if (fav) {
          setFaviconUrl(fav);
          // Dynamically update browser tab favicon
          let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "shortcut icon";
            document.getElementsByTagName("head")[0].appendChild(link);
          }
          link.href = fav;
        }

        // Dynamically update browser document title prefix
        if (data.siteName) {
          document.title = `${data.siteName} - Admin`;
        }
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-sidebar-bg transition-all duration-300 flex flex-col",
          "lg:relative lg:z-auto",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          isOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!isCollapsed && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 overflow-hidden"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-9 max-w-[150px] object-contain rounded"
                />
              ) : (
                <span className="text-xl font-bold text-white tracking-tight truncate">
                  {siteName}
                </span>
              )}
            </Link>
          )}

          {isCollapsed && (
            <Link
              href="/admin/dashboard"
              className="flex items-center justify-center mx-auto"
            >
              {faviconUrl || logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faviconUrl || logoUrl}
                  alt={siteName}
                  className="h-8 w-8 object-contain rounded"
                />
              ) : (
                <span className="text-xl font-bold text-primary-400">
                  {siteName.charAt(0)}
                </span>
              )}
            </Link>
          )}

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="lg:hidden text-sidebar-text hover:text-white p-1 rounded"
          >
            <X size={20} />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex items-center justify-center w-7 h-7 rounded-full ml-2 shrink-0",
              "bg-white/10 hover:bg-white/20 text-sidebar-text hover:text-white transition-colors",
              isCollapsed && "mx-auto rotate-180"
            )}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" &&
                pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-active text-sidebar-text-active shadow-lg shadow-primary-600/20"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                )}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-white/10">
          {!isCollapsed && (
            <p className="text-xs text-sidebar-text/50 text-center truncate">
              © {new Date().getFullYear()} {siteName}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
