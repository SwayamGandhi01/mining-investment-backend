"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import {
  Menu,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  ChevronRight,
  Settings,
} from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

// Breadcrumb label mapping
const labelMap: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  events: "Events",
  speakers: "Speakers",
  sponsors: "Sponsors",
  companies: "Companies",
  "latest-news": "Latest News",
  gallery: "Gallery",
  registrations: "Registrations",
  users: "Users",
  "admin-requests": "Admin Requests",
  settings: "Settings",
  create: "Create",
  edit: "Edit",
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { admin, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build breadcrumbs
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, idx) => ({
    label: labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, idx + 1).join("/"),
    isLast: idx === segments.length - 1,
  }));

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Left: menu + breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-card-hover text-muted transition-colors"
        >
          <Menu size={20} />
        </button>

        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight size={14} className="text-muted-foreground" />
              )}
              {crumb.isLast ? (
                <span className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: theme + profile */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher */}
        <div ref={themeRef} className="relative">
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className="p-2 rounded-lg hover:bg-card-hover text-muted transition-colors"
          >
            {theme === "dark" ? (
              <Moon size={18} />
            ) : theme === "light" ? (
              <Sun size={18} />
            ) : (
              <Monitor size={18} />
            )}
          </button>

          {themeOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-card border border-border rounded-xl shadow-lg py-1 animate-scale-in">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setThemeOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors",
                    theme === opt.value
                      ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20"
                      : "text-foreground hover:bg-card-hover"
                  )}
                >
                  <opt.icon size={16} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-card-hover transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
              {admin?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground max-w-[120px] truncate">
              {admin?.name || "Admin"}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-1 animate-scale-in">
              {/* Admin info */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">
                  {admin?.name}
                </p>
                <p className="text-xs text-muted truncate">{admin?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 capitalize">
                  {admin?.role}
                </span>
              </div>

              <Link
                href="/admin/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-card-hover transition-colors"
              >
                <Settings size={16} />
                Settings
              </Link>

              <Link
                href="/admin/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-card-hover transition-colors"
              >
                <User size={16} />
                Profile
              </Link>

              <div className="border-t border-border my-1" />

              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
