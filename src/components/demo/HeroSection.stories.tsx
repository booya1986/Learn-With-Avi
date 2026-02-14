import type { Meta, StoryObj } from "@storybook/react";

import { HeroSection } from "./HeroSection";

const meta = {
  title: "Orbyto/Demo/HeroSection",
  component: HeroSection,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
A complete hero section demonstrating the Orbyto design system implementation.

**Features:**
- Gradient background with geometric pattern overlay
- Glassmorphism cards with light and dark variants
- Orbyto button variants (primary white solid, secondary outline)
- Badge components with dot indicators
- Avatar and avatar group components
- Entrance animations (fade-in-up, scale-in)
- Fully responsive layout
- Accessible keyboard navigation

This component showcases the entire design system in action and serves as a reference for implementing the Orbyto aesthetic throughout the application.
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Complete hero section with all Orbyto design system elements
 */
export const Default: Story = {};

/**
 * Mobile view of the hero section
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story: "Hero section optimized for mobile devices with responsive layout and button stacking.",
      },
    },
  },
};

/**
 * Tablet view of the hero section
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
    docs: {
      description: {
        story: "Hero section optimized for tablet devices with medium-sized typography and layouts.",
      },
    },
  },
};

/**
 * Desktop view of the hero section
 */
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
    docs: {
      description: {
        story: "Full desktop experience with all design elements at their intended size and spacing.",
      },
    },
  },
};
