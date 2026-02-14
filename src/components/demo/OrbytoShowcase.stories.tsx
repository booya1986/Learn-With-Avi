import type { Meta, StoryObj } from "@storybook/react";

import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { IconBadge } from "@/components/ui/icon-badge";

const meta = {
  title: "Orbyto/Demo/Component Showcase",
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "orbyto",
      values: [
        {
          name: "orbyto",
          value: "radial-gradient(circle at 20% 30%, #4A7BD9 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8B6DD4 0%, transparent 50%), radial-gradient(circle at 50% 80%, #3A3F4E 0%, transparent 60%), linear-gradient(135deg, #6B75D6 0%, #8B6DD4 35%, #3A3F4E 70%, #2E3548 100%)",
        },
      ],
    },
    docs: {
      description: {
        component: `
**ORBYTO DESIGN SYSTEM COMPONENT SHOWCASE**

This showcase demonstrates all the Orbyto design system components in action:
- Buttons (Primary White Solid & Secondary Outline)
- Glass Cards (Light & Dark variants)
- Badges (Priority, Success, Warning, Error, Info)
- Icon Badges (Integration icons)
- Avatars (Single & Groups with overflow)

All components are shown on the exact Orbyto gradient background.
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Complete showcase of all Orbyto components
 */
export const AllComponents: Story = {
  render: () => (
    <div className="relative min-h-screen overflow-hidden" style={{
      background: `
        radial-gradient(circle at 20% 30%, #4A7BD9 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, #8B6DD4 0%, transparent 50%),
        radial-gradient(circle at 50% 80%, #3A3F4E 0%, transparent 60%),
        linear-gradient(135deg, #6B75D6 0%, #8B6DD4 35%, #3A3F4E 70%, #2E3548 100%)`
    }}>
      {/* Pattern Overlay - Dotted slot effect */}
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

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Orbyto Design System
          </h1>
          <p className="text-white/80 text-lg">
            Complete component showcase with exact Orbyto styling
          </p>
        </div>

        {/* Buttons Section */}
        <div>
          <h2 className="text-3xl font-semibold text-white mb-6">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="orbyto-primary" size="orbyto">
              Primary Button
            </Button>
            <Button variant="orbyto-secondary" size="orbyto">
              Secondary Button
            </Button>
            <Button variant="orbyto-primary" size="orbyto">
              Get Started, Free Trial!
            </Button>
            <Button variant="orbyto-secondary" size="orbyto">
              Watch a Demo
            </Button>
          </div>
        </div>

        {/* Glass Cards Section */}
        <div>
          <h2 className="text-3xl font-semibold text-white mb-6">Glass Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light Glass Card */}
            <GlassCard variant="light">
              <h3 className="text-white text-xl font-semibold mb-2">
                Light Glass Card
              </h3>
              <p className="text-white/70 text-sm">
                Perfect for overlays on the gradient background. Features subtle
                transparency and backdrop blur effect.
              </p>
            </GlassCard>

            {/* Dark Glass Card */}
            <GlassCard variant="dark">
              <h3 className="text-white text-xl font-semibold mb-2">
                Dark Glass Card
              </h3>
              <p className="text-white/70 text-sm">
                Ideal for content cards and task items. More opaque with stronger
                backdrop blur for better readability.
              </p>
            </GlassCard>

            {/* Glass Card with Badge and Avatar */}
            <GlassCard variant="dark" padding="lg" className="md:col-span-2">
              <div className="flex items-start gap-4 mb-4">
                <Badge variant="priority" showDot>
                  Priority
                </Badge>
                <Badge variant="success">Completed</Badge>
                <Badge variant="warning">Pending</Badge>
              </div>

              <h3 className="text-white text-xl font-semibold mb-2">
                Complete Task Card Example
              </h3>

              <p className="text-white/70 text-sm mb-6">
                This demonstrates a full task card with badges, avatar, and proper spacing.
                Matches the exact Orbyto design from the reference image.
              </p>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Avi"
                    alt="Avi Levin"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">Avi Levin</p>
                    <p className="text-white/50 text-xs">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <AvatarGroup max={3} size="sm" variant="ring">
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User1" alt="User 1" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User2" alt="User 2" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User3" alt="User 3" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User4" alt="User 4" />
                  </AvatarGroup>
                  <span className="text-white/60 text-sm">15 comments</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Badges Section */}
        <div>
          <h2 className="text-3xl font-semibold text-white mb-6">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="priority" showDot>
              Priority
            </Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="default">Default</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>

        {/* Icon Badges Section */}
        <div>
          <h2 className="text-3xl font-semibold text-white mb-6">Icon Badges</h2>
          <div className="flex flex-wrap gap-6 items-center">
            <IconBadge variant="default" size="sm" animated>
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
            </IconBadge>

            <IconBadge variant="default" size="md" animated>
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5H7z"/>
              </svg>
            </IconBadge>

            <IconBadge variant="default" size="lg" animated>
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
              </svg>
            </IconBadge>

            <IconBadge variant="glass" size="md" animated>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z"/>
              </svg>
            </IconBadge>

            <IconBadge variant="solid" size="md" animated>
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11.75a.75.75 0 000 1.5h.008a.75.75 0 000-1.5H9z"/>
              </svg>
            </IconBadge>
          </div>
        </div>

        {/* Avatars Section */}
        <div>
          <h2 className="text-3xl font-semibold text-white mb-6">Avatars</h2>
          <div className="space-y-6">
            {/* Single Avatars */}
            <div>
              <h3 className="text-white text-lg font-medium mb-3">Single Avatars</h3>
              <div className="flex items-center gap-4">
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=User1"
                  alt="User 1"
                  size="sm"
                />
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=User2"
                  alt="User 2"
                  size="md"
                />
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=User3"
                  alt="User 3"
                  size="lg"
                />
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=User4"
                  alt="User 4"
                  size="xl"
                  variant="ring"
                />
              </div>
            </div>

            {/* Avatar Groups */}
            <div>
              <h3 className="text-white text-lg font-medium mb-3">Avatar Groups</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-white/70 text-sm mb-2">Group with 4 avatars (max 3 shown)</p>
                  <AvatarGroup max={3} size="md" variant="ring">
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=A" alt="A" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=B" alt="B" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=C" alt="C" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=D" alt="D" />
                  </AvatarGroup>
                </div>

                <div>
                  <p className="text-white/70 text-sm mb-2">Group with 6 avatars (max 4 shown)</p>
                  <AvatarGroup max={4} size="sm" variant="ring">
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" alt="1" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=2" alt="2" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=3" alt="3" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=4" alt="4" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=5" alt="5" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=6" alt="6" />
                  </AvatarGroup>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Elements Section */}
        <div>
          <h2 className="text-3xl font-semibold text-white mb-6">Interactive Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interactive Card */}
            <GlassCard variant="dark" padding="md" interactive>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Interactive Card</p>
                  <p className="text-white/60 text-xs">Hover to see the effect</p>
                </div>
              </div>
            </GlassCard>

            {/* Card with Highlighted Text */}
            <GlassCard variant="dark" padding="md">
              <p className="text-white text-sm">
                This card has{" "}
                <span className="text-[#00D4FF]">highlighted text</span> in{" "}
                <span className="text-[#00D4FF]">cyan color</span> for{" "}
                <span className="text-[#00D4FF]">emphasis</span>
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  ),
};
