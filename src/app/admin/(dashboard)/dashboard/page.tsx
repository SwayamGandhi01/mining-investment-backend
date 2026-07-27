"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Handshake,
  Newspaper,
  ClipboardList,
  Building2,
  TrendingUp,
  Activity,
  FileText,
  Clock,
  Image as ImageIcon,
  Store,
  UserCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Building,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios, { AxiosResponse } from "axios";

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href: string;
}

interface RecentRegistration {
  _id: string;
  name: string;
  email: string;
  registrationNumber: string;
  status: string;
  createdAt: string;
  event?: {
    _id: string;
    title: string;
    slug: string;
  };
}

interface RecentEvent {
  _id: string;
  title: string;
  slug: string;
  year: number;
  startDate: string;
  location: string;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentRegs, setRecentRegs] = useState<RecentRegistration[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      // 1. Try unified stats endpoint first
      const response = await axios.get("/api/dashboard/stats");
      if (response.data?.success && response.data?.data) {
        const { counts, recentRegistrations, recentEvents: eventsData } = response.data.data;

        setStats([
          {
            label: "Total Events",
            value: counts.events || 0,
            icon: Calendar,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-50 dark:bg-blue-500/10",
            href: "/admin/events",
          },
          {
            label: "Registrations",
            value: counts.registrations || 0,
            icon: ClipboardList,
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-50 dark:bg-green-500/10",
            href: "/admin/registrations",
          },
          {
            label: "Investor Registrations",
            value: counts.investorRegistrations || 0,
            icon: UserCheck,
            color: "text-emerald-600 dark:text-emerald-400",
            bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
            href: "/admin/investor-registrations",
          },
          {
            label: "Company Registrations",
            value: counts.companyRegistrations || 0,
            icon: Building,
            color: "text-sky-600 dark:text-sky-400",
            bgColor: "bg-sky-50 dark:bg-sky-500/10",
            href: "/admin/company-registrations",
          },
          {
            label: "Speakers",
            value: counts.speakers || 0,
            icon: Users,
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-50 dark:bg-purple-500/10",
            href: "/admin/speakers",
          },
          {
            label: "Sponsors",
            value: counts.sponsors || 0,
            icon: Handshake,
            color: "text-amber-600 dark:text-amber-400",
            bgColor: "bg-amber-50 dark:bg-amber-500/10",
            href: "/admin/sponsors",
          },
          {
            label: "Exhibitors",
            value: counts.exhibitors || 0,
            icon: Store,
            color: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-50 dark:bg-orange-500/10",
            href: "/admin/exhibitors",
          },
          {
            label: "Companies",
            value: counts.companies || 0,
            icon: Building2,
            color: "text-indigo-600 dark:text-indigo-400",
            bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
            href: "/admin/companies",
          },
          {
            label: "Brochures",
            value: counts.brochures || 0,
            icon: FileText,
            color: "text-cyan-600 dark:text-cyan-400",
            bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
            href: "/admin/brochures",
          },
          {
            label: "Agendas",
            value: counts.agendas || 0,
            icon: Clock,
            color: "text-teal-600 dark:text-teal-400",
            bgColor: "bg-teal-50 dark:bg-teal-500/10",
            href: "/admin/agendas",
          },
          {
            label: "Blog Posts",
            value: counts.blogs || 0,
            icon: Newspaper,
            color: "text-pink-600 dark:text-pink-400",
            bgColor: "bg-pink-50 dark:bg-pink-500/10",
            href: "/admin/blogs",
          },
          {
            label: "Newsflash",
            value: counts.newsflash || 0,
            icon: Zap,
            color: "text-amber-600 dark:text-amber-400",
            bgColor: "bg-amber-50 dark:bg-amber-500/10",
            href: "/admin/newsflash",
          },
          {
            label: "Gallery Media",
            value: counts.gallery || 0,
            icon: ImageIcon,
            color: "text-rose-600 dark:text-rose-400",
            bgColor: "bg-rose-50 dark:bg-rose-500/10",
            href: "/admin/gallery",
          },
          {
            label: "Registered Users",
            value: counts.users || 0,
            icon: UserCircle,
            color: "text-violet-600 dark:text-violet-400",
            bgColor: "bg-violet-50 dark:bg-violet-500/10",
            href: "/admin/users",
          },
        ]);

        if (recentRegistrations) setRecentRegs(recentRegistrations);
        if (eventsData) setRecentEvents(eventsData);
        setLastUpdated(new Date());
        setLoading(false);
        setRefreshing(false);
        return;
      }
    } catch {
      // Endpoint fallback using Promise.allSettled
    }

    // 2. Fallback: Promise.allSettled across individual GET routes
    try {
      const results = await Promise.allSettled([
        axios.get("/api/events?limit=1"),
        axios.get("/api/registrations?limit=1"),
        axios.get("/api/investor-registrations?limit=1"),
        axios.get("/api/company-registrations?limit=1"),
        axios.get("/api/speakers?limit=1"),
        axios.get("/api/sponsors?limit=1"),
        axios.get("/api/exhibitors?limit=1"),
        axios.get("/api/companies?limit=1"),
        axios.get("/api/brochures?limit=1"),
        axios.get("/api/agendas?limit=1"),
        axios.get("/api/blogs?limit=1"),
        axios.get("/api/gallery?limit=1"),
        axios.get("/api/users?limit=1"),
      ]);

      const getTotal = (res: PromiseSettledResult<AxiosResponse>) =>
        res.status === "fulfilled" && res.value.data?.pagination?.total
          ? res.value.data.pagination.total
          : 0;

      setStats([
        {
          label: "Total Events",
          value: getTotal(results[0]),
          icon: Calendar,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-500/10",
          href: "/admin/events",
        },
        {
          label: "Registrations",
          value: getTotal(results[1]),
          icon: ClipboardList,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-500/10",
          href: "/admin/registrations",
        },
        {
          label: "Investor Registrations",
          value: getTotal(results[2]),
          icon: UserCheck,
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
          href: "/admin/investor-registrations",
        },
        {
          label: "Company Registrations",
          value: getTotal(results[3]),
          icon: Building,
          color: "text-sky-600 dark:text-sky-400",
          bgColor: "bg-sky-50 dark:bg-sky-500/10",
          href: "/admin/company-registrations",
        },
        {
          label: "Speakers",
          value: getTotal(results[4]),
          icon: Users,
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-50 dark:bg-purple-500/10",
          href: "/admin/speakers",
        },
        {
          label: "Sponsors",
          value: getTotal(results[5]),
          icon: Handshake,
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-500/10",
          href: "/admin/sponsors",
        },
        {
          label: "Exhibitors",
          value: getTotal(results[6]),
          icon: Store,
          color: "text-orange-600 dark:text-orange-400",
          bgColor: "bg-orange-50 dark:bg-orange-500/10",
          href: "/admin/exhibitors",
        },
        {
          label: "Companies",
          value: getTotal(results[7]),
          icon: Building2,
          color: "text-indigo-600 dark:text-indigo-400",
          bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
          href: "/admin/companies",
        },
        {
          label: "Brochures",
          value: getTotal(results[8]),
          icon: FileText,
          color: "text-cyan-600 dark:text-cyan-400",
          bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
          href: "/admin/brochures",
        },
        {
          label: "Agendas",
          value: getTotal(results[9]),
          icon: Clock,
          color: "text-teal-600 dark:text-teal-400",
          bgColor: "bg-teal-50 dark:bg-teal-500/10",
          href: "/admin/agendas",
        },
        {
          label: "Blog Posts",
          value: getTotal(results[10]),
          icon: Newspaper,
          color: "text-pink-600 dark:text-pink-400",
          bgColor: "bg-pink-50 dark:bg-pink-500/10",
          href: "/admin/blogs",
        },
        {
          label: "Gallery Media",
          value: getTotal(results[11]),
          icon: ImageIcon,
          color: "text-rose-600 dark:text-rose-400",
          bgColor: "bg-rose-50 dark:bg-rose-500/10",
          href: "/admin/gallery",
        },
        {
          label: "Registered Users",
          value: getTotal(results[12]),
          icon: UserCircle,
          color: "text-violet-600 dark:text-violet-400",
          bgColor: "bg-violet-50 dark:bg-violet-500/10",
          href: "/admin/users",
        },
      ]);
      setLastUpdated(new Date());
    } catch {
      // Soft ignore errors on fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Auto refresh stats every 30 seconds
    const interval = setInterval(() => {
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Real-time platform overview and system statistics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => loadStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={cn(refreshing && "animate-spin text-primary-500")}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group block"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    stat.bgColor
                  )}
                >
                  <Icon size={22} className={stat.color} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted group-hover:text-primary-500 transition-colors">
                <span>Manage entity</span>
                <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Plus size={18} className="text-primary-500" />
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/events"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-xs font-medium transition-colors"
          >
            <Calendar size={14} />
            <span>Manage Events</span>
          </Link>
          <Link
            href="/admin/registrations"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium transition-colors"
          >
            <ClipboardList size={14} />
            <span>View Registrations</span>
          </Link>
          <Link
            href="/admin/speakers"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-xs font-medium transition-colors"
          >
            <Users size={14} />
            <span>Manage Speakers</span>
          </Link>
          <Link
            href="/admin/brochures"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 text-xs font-medium transition-colors"
          >
            <FileText size={14} />
            <span>Manage Brochures</span>
          </Link>
          <Link
            href="/admin/blogs"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 text-xs font-medium transition-colors"
          >
            <Newspaper size={14} />
            <span>Manage Blog Posts</span>
          </Link>
        </div>
      </div>

      {/* Live Activity & System Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-primary-500" />
              <h2 className="text-lg font-semibold text-foreground">
                Recent Registrations
              </h2>
            </div>
            <Link
              href="/admin/registrations"
              className="text-xs text-primary-500 hover:underline flex items-center gap-1 font-medium"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recentRegs.length > 0 ? (
            <div className="space-y-3">
              {recentRegs.map((reg) => (
                <div
                  key={reg._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-border/50 hover:border-border transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {reg.name}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {reg.email} {reg.event?.title ? `• ${reg.event.title}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-500">
                      {reg.status || "confirmed"}
                    </span>
                    <p className="text-[10px] text-muted mt-1">
                      {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted">No recent registrations found.</p>
            </div>
          )}
        </div>

        {/* Recent Events & System Health */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-accent-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Latest Events
                </h2>
              </div>
              <Link
                href="/admin/events"
                className="text-xs text-primary-500 hover:underline flex items-center gap-1 font-medium"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.map((evt) => (
                  <div
                    key={evt._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-sm font-medium text-foreground truncate">
                        {evt.title}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {evt.location} • Edition {evt.year}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase",
                          evt.status === "published"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-amber-500/10 text-amber-500"
                        )}
                      >
                        {evt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center border border-dashed border-border rounded-lg">
                <p className="text-sm text-muted">No events recorded yet.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
              <CheckCircle2 size={14} /> Systems Operational
            </span>
            <span>Auto-refreshing active (30s)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
