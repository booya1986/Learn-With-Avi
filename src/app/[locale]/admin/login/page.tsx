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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"login" | "signup">("login");

  // Extract locale from pathname (e.g., /en/admin/login -> en)
  const locale = pathname?.split('/')[1] || 'en';

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: signupErrors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        const rawCallbackUrl = searchParams.get("callbackUrl") || `/${locale}/admin/dashboard`;
        // Validate callback URL to prevent open redirect attacks
        const callbackUrl = rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
          ? rawCallbackUrl
          : `/${locale}/admin/dashboard`;
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create account");
        return;
      }

      // Auto-login after successful signup
      const loginResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (loginResult?.ok) {
        router.push(`/${locale}/admin/dashboard`);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, #4A6FDC 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, #6B75D6 0%, transparent 50%),
          linear-gradient(135deg, #2E3548 0%, #3A3F4E 100%)`
      }}
    >
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 100px,
              rgba(255, 255, 255, 0.06) 100px,
              rgba(255, 255, 255, 0.06) 102px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 100px,
              rgba(255, 255, 255, 0.06) 100px,
              rgba(255, 255, 255, 0.06) 102px
            )
          `,
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4A6FDC] to-[#8B4FD4] bg-clip-text text-transparent">
            LearnWithAvi
          </h1>
          <p className="mt-2 text-white/80">Admin Panel</p>
        </div>

        <GlassCard variant="dark" padding="none">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setError(null);
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "login"
                  ? "border-b-2 border-[#4A6FDC] text-white"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setError(null);
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "signup"
                  ? "border-b-2 border-[#4A6FDC] text-white"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Forms */}
          <div className="p-8">
            {error ? <div className="mb-6 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div> : null}

            {activeTab === "login" ? (
              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-6">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-medium text-white/90"
                  >
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    {...registerLogin("email")}
                    className="glass-input mt-1 block w-full rounded-md px-3 py-2 text-sm"
                    placeholder="admin@example.com"
                    disabled={isLoading}
                  />
                  {loginErrors.email ? <p className="mt-1 text-sm text-red-400">{loginErrors.email.message}</p> : null}
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-white/90"
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    {...registerLogin("password")}
                    className="glass-input mt-1 block w-full rounded-md px-3 py-2 text-sm"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {loginErrors.password ? <p className="mt-1 text-sm text-red-400">
                      {loginErrors.password.message}
                    </p> : null}
                </div>

                <Button
                  type="submit"
                  variant="orbyto-primary"
                  size="orbyto"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="me-2" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-6">
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-sm font-medium text-white/90"
                  >
                    Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    {...registerSignup("name")}
                    className="glass-input mt-1 block w-full rounded-md px-3 py-2 text-sm"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                  {signupErrors.name ? <p className="mt-1 text-sm text-red-400">{signupErrors.name.message}</p> : null}
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-sm font-medium text-white/90"
                  >
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    {...registerSignup("email")}
                    className="glass-input mt-1 block w-full rounded-md px-3 py-2 text-sm"
                    placeholder="admin@example.com"
                    disabled={isLoading}
                  />
                  {signupErrors.email ? <p className="mt-1 text-sm text-red-400">{signupErrors.email.message}</p> : null}
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-sm font-medium text-white/90"
                  >
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    {...registerSignup("password")}
                    className="glass-input mt-1 block w-full rounded-md px-3 py-2 text-sm"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {signupErrors.password ? <p className="mt-1 text-sm text-red-400">
                      {signupErrors.password.message}
                    </p> : null}
                </div>

                <div>
                  <label
                    htmlFor="signup-confirmPassword"
                    className="block text-sm font-medium text-white/90"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="signup-confirmPassword"
                    type="password"
                    {...registerSignup("confirmPassword")}
                    className="glass-input mt-1 block w-full rounded-md px-3 py-2 text-sm"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {signupErrors.confirmPassword ? <p className="mt-1 text-sm text-red-400">
                      {signupErrors.confirmPassword.message}
                    </p> : null}
                </div>

                <Button
                  type="submit"
                  variant="orbyto-primary"
                  size="orbyto"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="me-2" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
