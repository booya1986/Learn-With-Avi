"use client";

import * as React from "react";

import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { IconBadge } from "@/components/ui/icon-badge";

/**
 * OrbytoCompletePage - Complete replica of the Orbyto design with LearnWithAvi branding
 *
 * This component is an EXACT replica of the Orbyto landing page design,
 * featuring all elements: navigation, hero section, task cards, integration icons,
 * connecting lines, and the complete layout.
 */
export const OrbytoCompletePage = () => {
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
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center">
              <svg className="w-5 h-5 text-[#4A7BD9]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
              </svg>
            </div>
            <span className="text-white text-xl font-bold">LearnWithAvi</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-white/80 hover:text-white transition-colors">
              About
            </a>
            <a href="#" className="text-white/80 hover:text-white transition-colors">
              Service
            </a>
            <a href="#" className="text-white/80 hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#" className="text-white/80 hover:text-white transition-colors">
              Features
            </a>
          </div>

          <Button variant="orbyto-primary" size="orbyto">
            Get Started
          </Button>
        </nav>

        {/* Main Content - No Side Icons, Full Width Hero */}
        <div className="max-w-5xl mx-auto">
          {/* Center - Hero Content */}
          <div className="text-center space-y-8">
            {/* Hero Title */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Learn Smarter with AI-Powered Education
                <br />
                Interactive Courses & Real-Time Support
              </h1>

              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
                Master new skills with AI-guided learning, interactive video courses,
                and real-time voice assistance. Your personal learning companion.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="orbyto-primary" size="orbyto">
                Start Learning, Free Trial!
              </Button>
              <Button variant="orbyto-secondary" size="orbyto">
                Watch a Demo
              </Button>
            </div>

            {/* Main Task Card with Lightning Icon */}
            <div className="relative pt-16">
              {/* Lightning Icon Circle */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 shadow-[0_0_40px_rgba(74,111,220,0.4)] flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              {/* Main Task Card */}
              <div className="pt-12">
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

                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16h6M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                      </svg>
                      <span className="text-white/60 text-sm">15</span>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Secondary Task Card */}
              <div className="mt-6">
                <GlassCard variant="dark" padding="md" interactive>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">
                          Arrange <span className="text-[#00D4FF]">my schedule</span> for upcoming{" "}
                          <span className="text-[#00D4FF]">3 days</span> for{" "}
                          <span className="text-[#00D4FF]">personal tasks</span>
                        </p>
                      </div>
                    </div>
                    <AvatarGroup max={3} size="sm" variant="ring">
                      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Alex" />
                      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emma" alt="Emma" />
                      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=James" alt="James" />
                    </AvatarGroup>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats/Metrics Row (Orbyto style) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Stat Card 1 */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <GlassCard variant="light" padding="lg" className="pt-12 text-center">
              <div className="text-3xl font-bold text-white mb-2">5,000+</div>
              <div className="text-white/70 text-sm">Active Students</div>
            </GlassCard>
          </div>

          {/* Stat Card 2 */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <GlassCard variant="light" padding="lg" className="pt-12 text-center">
              <div className="text-3xl font-bold text-white mb-2">150+</div>
              <div className="text-white/70 text-sm">Courses Available</div>
            </GlassCard>
          </div>

          {/* Stat Card 3 */}
          <div className="relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <GlassCard variant="light" padding="lg" className="pt-12 text-center">
              <div className="text-3xl font-bold text-white mb-2">4.9/5</div>
              <div className="text-white/70 text-sm">Average Rating</div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
