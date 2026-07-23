"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import {
  Loader2, Eye, EyeOff, Lock, Mail, User, Shield,
  ChevronRight, LogIn, UserPlus,
} from "lucide-react";

// ─── Schemas ─────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["superadmin", "admin", "editor"]),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

// ─── Role Info ────────────────────────────────────────────────────────────────
const ROLES = [
  {
    value: "superadmin",
    label: "Super Admin",
    description: "Full access to all features. Only one allowed.",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/40",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "👑",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage content, users, and settings.",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/40",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: "🛡️",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Create and edit content only.",
    color: "from-emerald-500/20 to-green-500/20 border-emerald-500/40",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: "✏️",
  },
] as const;

// ─── Field Component ──────────────────────────────────────────────────────────
function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  // Signup form
  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "admin" },
  });

  const selectedRole = signupForm.watch("role");

  // ─── Submit handlers ─────────────────────────────────────────────────────
  const onLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", data);
      if (res.data.success) {
        toast.success("Welcome back!");
        router.push("/admin/dashboard");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Login failed");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (data: SignupFormData) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/signup", data);
      if (res.data.success) {
        toast.success("Account created! Please sign in.");
        setMode("login");
        loginForm.setValue("email", data.email);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Sign up failed");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700/60 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-medium";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/30 mb-4 shadow-lg shadow-primary-900/30">
            <Shield className="text-primary-400" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Investment<span className="text-primary-400">Admin</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "login" ? "Sign in to your admin dashboard" : "Create a new admin account"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-900/60 border border-slate-700/50 rounded-2xl p-1 mb-6 backdrop-blur">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              mode === "login"
                ? "bg-primary-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <LogIn size={15} />
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              mode === "signup"
                ? "bg-primary-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <UserPlus size={15} />
            Sign Up
          </button>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
              <Field label="Email Address" icon={<Mail size={18} />} error={loginForm.formState.errors.email?.message}>
                <input
                  {...loginForm.register("email")}
                  type="email"
                  placeholder="admin@example.com"
                  className={inputClass}
                />
              </Field>

              <Field label="Password" icon={<Lock size={18} />} error={loginForm.formState.errors.password?.message}>
                <input
                  {...loginForm.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : <><LogIn size={18} /> Sign In</>}
              </button>
            </form>
          )}

          {/* ── SIGNUP FORM ── */}
          {mode === "signup" && (
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-5">
              <Field label="Full Name" icon={<User size={18} />} error={signupForm.formState.errors.name?.message}>
                <input
                  {...signupForm.register("name")}
                  type="text"
                  placeholder="John Doe"
                  className={inputClass}
                />
              </Field>

              <Field label="Email Address" icon={<Mail size={18} />} error={signupForm.formState.errors.email?.message}>
                <input
                  {...signupForm.register("email")}
                  type="email"
                  placeholder="admin@example.com"
                  className={inputClass}
                />
              </Field>

              <Field label="Password" icon={<Lock size={18} />} error={signupForm.formState.errors.password?.message}>
                <input
                  {...signupForm.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </Field>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Role
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r cursor-pointer transition-all duration-200 ${
                        selectedRole === r.value
                          ? `${r.color} ring-1 ring-white/20`
                          : "border-slate-700/50 from-slate-800/30 to-slate-800/30 hover:border-slate-600/50"
                      }`}
                    >
                      <input
                        {...signupForm.register("role")}
                        type="radio"
                        value={r.value}
                        className="sr-only"
                      />
                      <span className="text-xl">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{r.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${r.badge}`}>
                            {r.value}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>
                      </div>
                      {selectedRole === r.value && (
                        <div className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                {signupForm.formState.errors.role && (
                  <p className="mt-1 text-xs text-red-400">{signupForm.formState.errors.role.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                ) : (
                  <><UserPlus size={18} /> Create Account <ChevronRight size={16} /></>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} Investment Admin Panel. All rights reserved.
        </p>
      </div>
    </div>
  );
}
