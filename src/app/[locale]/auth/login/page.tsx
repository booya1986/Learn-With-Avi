"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function StudentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn("user-credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setIsLoading(false);
    } else if (result?.ok) {
      const callbackUrl = searchParams.get("callbackUrl") || `/${locale}`;
      const safeUrl = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : `/${locale}`;
      router.push(safeUrl);
    }
  };

  const callbackUrlParam = searchParams.get("callbackUrl") ?? `/${locale}`;
  const safeCallbackUrl =
    callbackUrlParam.startsWith("/") && !callbackUrlParam.startsWith("//")
      ? callbackUrlParam
      : `/${locale}`;

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: safeCallbackUrl });
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, #4A6FDC 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, #6B75D6 0%, transparent 50%),
          linear-gradient(135deg, #2E3548 0%, #3A3F4E 100%)`,
      }}
    >
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4A6FDC] to-[#8B4FD4] bg-clip-text text-transparent">
            LearnWithAvi
          </h1>
          <p className="mt-2 text-white/80">Sign in to continue learning</p>
        </div>

        <GlassCard variant="dark" padding="none">
          <div className="p-8">
            {error ? <div className="mb-6 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div> : null}

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-md border border-white/20 bg-white/10 hover:bg-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-5"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/15" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-transparent px-2 text-white/40">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass-input block w-full rounded-md px-3 py-2 text-sm"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass-input block w-full rounded-md px-3 py-2 text-sm"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                variant="orbyto-primary"
                size="orbyto"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-white/60">
              Don&apos;t have an account?{" "}
              <Link
                href={`/${locale}/auth/signup${searchParams.get("callbackUrl") ? `?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}` : ""}`}
                className="text-[#4A6FDC] hover:text-[#6B8FFF] font-medium"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
