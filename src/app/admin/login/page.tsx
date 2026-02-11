'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/admin/common/LoadingSpinner'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type LoginFormData = z.infer<typeof loginSchema>
type SignupFormData = z.infer<typeof signupSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'login' | 'signup'>('login')

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: signupErrors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.ok) {
        const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'
        router.push(callbackUrl)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSignupSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to create account')
        return
      }

      // Auto-login after successful signup
      const loginResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (loginResult?.ok) {
        router.push('/admin/dashboard')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">LearnWithAvi</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Admin Panel</p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login')
                setError(null)
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup')
                setError(null)
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'signup'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Forms */}
          <div className="p-8">
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    {...registerLogin('email')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="admin@example.com"
                    disabled={isLoading}
                  />
                  {loginErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{loginErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    {...registerLogin('password')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {loginErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{loginErrors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="me-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    {...registerSignup('name')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                  {signupErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{signupErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    {...registerSignup('email')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="admin@example.com"
                    disabled={isLoading}
                  />
                  {signupErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{signupErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    {...registerSignup('password')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {signupErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{signupErrors.password.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signup-confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="signup-confirmPassword"
                    type="password"
                    {...registerSignup('confirmPassword')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {signupErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {signupErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="me-2" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
