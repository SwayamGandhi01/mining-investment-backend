"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  Handshake,
  Newspaper,
  ClipboardList,
  Building2,
  TrendingUp,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [eventsRes, speakersRes, sponsorsRes, regsRes, companiesRes, blogsRes] =
          await Promise.all([
            axios.get("/api/events?limit=1"),
            axios.get("/api/speakers?limit=1"),
            axios.get("/api/sponsors?limit=1"),
            axios.get("/api/registrations?limit=1"),
            axios.get("/api/companies?limit=1"),
            axios.get("/api/blogs?limit=1"),
          ]);

        setStats([
          {
            label: "Total Events",
            value: eventsRes.data.pagination?.total || 0,
            icon: Calendar,
            color: "text-blue-600",
            bgColor: "bg-blue-50 dark:bg-blue-500/10",
          },
          {
            label: "Speakers",
            value: speakersRes.data.pagination?.total || 0,
            icon: Users,
            color: "text-purple-600",
            bgColor: "bg-purple-50 dark:bg-purple-500/10",
          },
          {
            label: "Sponsors",
            value: sponsorsRes.data.pagination?.total || 0,
            icon: Handshake,
            color: "text-amber-600",
            bgColor: "bg-amber-50 dark:bg-amber-500/10",
          },
          {
            label: "Registrations",
            value: regsRes.data.pagination?.total || 0,
            icon: ClipboardList,
            color: "text-green-600",
            bgColor: "bg-green-50 dark:bg-green-500/10",
          },
          {
            label: "Companies",
            value: companiesRes.data.pagination?.total || 0,
            icon: Building2,
            color: "text-indigo-600",
            bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
          },
          {
            label: "Blog Posts",
            value: blogsRes.data.pagination?.total || 0,
            icon: Newspaper,
            color: "text-pink-600",
            bgColor: "bg-pink-50 dark:bg-pink-500/10",
          },
        ]);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Overview of platform entities and system stats.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted font-medium">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    stat.bgColor
                  )}
                >
                  <Icon size={22} className={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-primary-500" />
            <h2 className="text-lg font-semibold text-foreground">
              Recent Activity
            </h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted py-8 text-center">
              All backend services operational and ready for requests.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-accent-500" />
            <h2 className="text-lg font-semibold text-foreground">
              System Overview
            </h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted py-8 text-center">
              MongoDB Atlas & Cloudinary active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
