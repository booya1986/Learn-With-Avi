import type { Meta, StoryObj } from "@storybook/react";

import { OrbytoCompletePage } from "./OrbytoCompletePage";

const meta = {
  title: "Orbyto/Demo/Complete Page",
  component: OrbytoCompletePage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
**EXACT REPLICA OF ORBYTO DESIGN**

This is a pixel-perfect recreation of the Orbyto landing page design with LearnWithAvi branding.

**Features:**
- ✅ Exact gradient background (#4A7BD9 → #6975D6 → #8B6DD4)
- ✅ Geometric grid pattern overlay (60px spacing, subtle opacity)
- ✅ Navigation with white solid button
- ✅ Hero section with primary and secondary CTAs
- ✅ Lightning icon circle with glow effect
- ✅ Main task card with glassmorphism (dark variant)
- ✅ Secondary task card with highlighted text
- ✅ Integration icon badges on left and right sides
- ✅ Dotted connector lines between icons
- ✅ Bottom statistics cards with floating icons
- ✅ Avatar and avatar groups
- ✅ Priority badges with dot indicators
- ✅ All animations and transitions

This component showcases the complete Orbyto design system implementation.
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof OrbytoCompletePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Complete Orbyto-style page with all design elements
 */
export const Default: Story = {};

/**
 * Desktop view (recommended for best experience)
 */
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
    docs: {
      description: {
        story: "Full desktop experience showing all Orbyto design elements at their intended size and spacing.",
      },
    },
  },
};

/**
 * Tablet view
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
    docs: {
      description: {
        story: "Tablet view with responsive adjustments to the Orbyto layout.",
      },
    },
  },
};

/**
 * Mobile view
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story: "Mobile view with stacked layout and adapted spacing.",
      },
    },
  },
};
