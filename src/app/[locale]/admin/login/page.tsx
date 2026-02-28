"use client";

import * as React from "react";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { LoadingSpinner } from "@/components/admin/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(12, "Password must be at least 12 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(12, "Password must be at least 12 characters"),
  confirmPassword: z.string().min(12, "Password must be at least 12 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"login" | "signup">("login");

  const locale = pathname?.split('/')[1] || 'en';

  const { register: reg, handleSubmit: hSubmit, formState: { errors: le } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const { register: regS, handleSubmit: hSubmitS, formState: { errors: se } } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("admin-credentials", { email: data.email, password: data.password, redirect: false });
      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        const raw = searchParams.get("callbackUrl") || `/${locale}/admin/dashboard`;
        router.push(raw.startsWith("/") && !raw.startsWith("//") ? raw : `/${locale}/admin/dashboard`);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });
      const result = await resp.json();
      if (!resp.ok) { setError(result.error || "Failed to create account"); return; }

      const loginResult = await signIn("admin-credentials", { email: data.email, password: data.password, redirect: false });
      if (loginResult?.ok) router.push(`/${locale}/admin/dashboard`);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const bg = `radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 50%, transparent 70%), #1b1b1b`;

  const inputCls = "glass-input mt-1 block w-full rounded-md px-3 py-2 text-sm";
  const labelCls = "block text-sm font-medium text-white/90";
  const errCls = "mt-1 text-sm text-red-400";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden" style={{ background: bg }}>
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-400" style={{ textShadow: '0 0 24px rgba(74,222,128,0.3)' }}>LearnWithAvi</h1>
          <p className="mt-2 text-white/80">Admin Panel</p>
        </div>

        <GlassCard variant="dark" padding="none">
          <div className="flex border-b border-white/10">
            {(["login", "signup"] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => { setActiveTab(tab); setError(null); }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors capitalize ${
                  activeTab === tab ? "border-b-2 border-green-500 text-green-400" : "text-white/40 hover:text-white/70"}`}>
                {tab === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          <div className="p-8">
            {error ? <div className="mb-6 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div> : null}

            {activeTab === "login" ? (
              <form onSubmit={(e) => void hSubmit(onLogin)(e)} className="space-y-6">
                <div>
                  <label htmlFor="login-email" className={labelCls}>Email</label>
                  <input id="login-email" type="email" {...reg("email")} className={inputCls} placeholder="admin@example.com" disabled={isLoading} />
                  {le.email ? <p className={errCls}>{le.email.message}</p> : null}
                </div>
                <div>
                  <label htmlFor="login-password" className={labelCls}>Password</label>
                  <input id="login-password" type="password" {...reg("password")} className={inputCls} placeholder="••••••••" disabled={isLoading} />
                  {le.password ? <p className={errCls}>{le.password.message}</p> : null}
                </div>
                <Button type="submit" variant="orbyto-primary" size="orbyto" className="w-full" disabled={isLoading}>
                  {isLoading ? <><LoadingSpinner size="sm" className="me-2" />Signing in...</> : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={(e) => void hSubmitS(onSignup)(e)} className="space-y-6">
                <div>
                  <label htmlFor="signup-name" className={labelCls}>Name</label>
                  <input id="signup-name" type="text" {...regS("name")} className={inputCls} placeholder="John Doe" disabled={isLoading} />
                  {se.name ? <p className={errCls}>{se.name.message}</p> : null}
                </div>
                <div>
                  <label htmlFor="signup-email" className={labelCls}>Email</label>
                  <input id="signup-email" type="email" {...regS("email")} className={inputCls} placeholder="admin@example.com" disabled={isLoading} />
                  {se.email ? <p className={errCls}>{se.email.message}</p> : null}
                </div>
                <div>
                  <label htmlFor="signup-password" className={labelCls}>Password</label>
                  <input id="signup-password" type="password" {...regS("password")} className={inputCls} placeholder="••••••••" disabled={isLoading} />
                  {se.password ? <p className={errCls}>{se.password.message}</p> : null}
                </div>
                <div>
                  <label htmlFor="signup-confirmPassword" className={labelCls}>Confirm Password</label>
                  <input id="signup-confirmPassword" type="password" {...regS("confirmPassword")} className={inputCls} placeholder="••••••••" disabled={isLoading} />
                  {se.confirmPassword ? <p className={errCls}>{se.confirmPassword.message}</p> : null}
                </div>
                <Button type="submit" variant="orbyto-primary" size="orbyto" className="w-full" disabled={isLoading}>
                  {isLoading ? <><LoadingSpinner size="sm" className="me-2" />Creating account...</> : "Create Account"}
                </Button>
              </form>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LoginPage;
