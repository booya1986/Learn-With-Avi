"use client";

import * as React from "react";

import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

/**
 * HeroSection - A demo component showcasing the Orbyto design system
 *
 * This component demonstrates:
 * - Gradient background with geometric pattern
 * - Glassmorphism effects
 * - Button variants (primary white, secondary outline)
 * - Badge components
 * - Avatar components
 * - Animations and transitions
 *
 * @example
 * ```tsx
 * <HeroSection />
 * ```
 */
export const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden" style={{
      background: `
        radial-gradient(circle at 20% 30%, #4A7BD9 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, #8B6DD4 0%, transparent 50%),
        radial-gradient(circle at 50% 80%, #3A3F4E 0%, transparent 60%),
        linear-gradient(135deg, #6B75D6 0%, #8B6DD4 35%, #3A3F4E 70%, #2E3548 100%)`
    }}>
      {/* Background Slot Pattern - Dotted grid effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 100px,
              rgba(255, 255, 255, 0.06) 100px,
              rgba(255, 255, 255, 0.06) 102px,
              transparent 102px,
              transparent 105px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 100px,
              rgba(255, 255, 255, 0.06) 100px,
              rgba(255, 255, 255, 0.06) 102px,
              transparent 102px,
              transparent 105px
            )
          `,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-6 py-20 lg:py-32">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-20 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg shadow-md" />
            <span className="text-white text-xl font-bold">LearnWithAvi</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#"
              className="text-white/80 hover:text-white transition-colors focus-orbyto"
            >
              About
            </a>
            <a
              href="#"
              className="text-white/80 hover:text-white transition-colors focus-orbyto"
            >
              Courses
            </a>
            <a
              href="#"
              className="text-white/80 hover:text-white transition-colors focus-orbyto"
            >
              Features
            </a>
          </div>

          <Button variant="orbyto-primary" size="orbyto">
            Get Started
          </Button>
        </nav>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up delay-150">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Learn Smarter with AI-Powered Education
            <br />
            Interactive Courses & Real-Time Support
          </h1>

          <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-12 max-w-2xl mx-auto">
            Master new skills with AI-guided learning, interactive video courses,
            and real-time voice assistance. Your personal learning companion.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="orbyto-primary" size="orbyto">
              Start Learning, Free Trial!
            </Button>

            <Button variant="orbyto-secondary" size="orbyto">
              Watch a Demo
            </Button>
          </div>
        </div>

        {/* Main Task Card - Exact Orbyto Style */}
        <div className="mt-32 max-w-3xl mx-auto animate-fade-in-up delay-300">
          <GlassCard variant="dark" padding="lg">
            <div className="flex items-start gap-4 mb-4">
              <Badge variant="priority" showDot>
                Priority
              </Badge>
            </div>

            <h3 className="text-white text-xl font-semibold mb-2">
              Master React & TypeScript - Build Modern Web Apps
            </h3>

            <p className="text-white/70 text-sm mb-6">
              Complete hands-on course with AI-powered guidance, interactive coding challenges,
              and real-time voice assistance. Perfect for developers ready to level up.
            </p>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Avi"
                  alt="Avi Levin"
                  variant="default"
                />
                <div>
                  <p className="text-white text-sm font-medium">Avi Levin</p>
                  <p className="text-white/50 text-xs">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <AvatarGroup max={3} size="sm" variant="ring">
                  <Avatar
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                    alt="Sarah"
                  />
                  <Avatar
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mike"
                    alt="Mike"
                  />
                  <Avatar
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica"
                    alt="Jessica"
                  />
                  <Avatar
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=David"
                    alt="David"
                  />
                </AvatarGroup>
                <span className="text-white/60 text-sm">24 students</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Secondary Task Card - Below Main Card */}
        <div className="mt-6 max-w-3xl mx-auto animate-fade-in-up delay-300">
          <GlassCard variant="dark" padding="md" interactive>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    Arrange <span className="text-[#00D4FF]">my schedule</span> for upcoming{" "}
                    <span className="text-[#00D4FF]">3 days</span> for{" "}
                    <span className="text-[#00D4FF]">personal tasks</span>
                  </p>
                </div>
              </div>
              <AvatarGroup max={3} size="sm" variant="ring">
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
                  alt="Alex"
                />
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emma"
                  alt="Emma"
                />
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=James"
                  alt="James"
                />
              </AvatarGroup>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
