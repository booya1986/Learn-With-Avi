import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "./badge";
import { GlassCard } from "./glass-card";

const meta = {
  title: "Orbyto/GlassCard",
  component: GlassCard,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "orbyto",
      values: [
        {
          name: "orbyto",
          value: "linear-gradient(135deg, #2D4A7C 0%, #3D5A99 35%, #4A4668 65%, #5B4E7A 100%)",
        },
      ],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["light", "dark"],
      description: "The visual style of the glass card",
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
      description: "Padding size inside the card",
    },
    interactive: {
      control: "boolean",
      description: "Whether the card is clickable/interactive",
    },
  },
} satisfies Meta<typeof GlassCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LightVariant: Story = {
  args: {
    variant: "light",
    padding: "md",
    children: (
      <div>
        <h3 className="text-white text-lg font-semibold mb-2">Glass Card Light</h3>
        <p className="text-white/70 text-sm">
          This is a light glassmorphism card with subtle transparency and blur effects.
        </p>
      </div>
    ),
  },
};

export const DarkVariant: Story = {
  args: {
    variant: "dark",
    padding: "md",
    children: (
      <div>
        <h3 className="text-white text-lg font-semibold mb-2">Glass Card Dark</h3>
        <p className="text-white/70 text-sm">
          This is a dark glassmorphism card with more opacity for better contrast.
        </p>
      </div>
    ),
  },
};

export const WithBadge: Story = {
  args: {
    variant: "dark",
    padding: "md",
    children: (
      <div>
        <Badge variant="priority" showDot className="mb-4">
          Priority
        </Badge>
        <h3 className="text-white text-xl font-semibold mb-2">
          Boost Team Flow Automate, Sync, and Collaborate Smarter
        </h3>
        <p className="text-white/70 text-sm">
          Enable real-time collaboration with AI-powered task automation, lightning-fast
          cloud sync, and deep integrations.
        </p>
      </div>
    ),
  },
};

export const Interactive: Story = {
  args: {
    variant: "light",
    padding: "md",
    interactive: true,
    onClick: () => alert("Card clicked!"),
    children: (
      <div>
        <h3 className="text-white text-lg font-semibold mb-2">Clickable Card</h3>
        <p className="text-white/70 text-sm">
          This card is interactive. Click me to see an alert!
        </p>
      </div>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    variant: "light",
    padding: "none",
    children: (
      <div className="p-6">
        <h3 className="text-white text-lg font-semibold mb-2">Custom Padding</h3>
        <p className="text-white/70 text-sm">
          This card has padding=&ldquo;none&rdquo; but custom padding is applied inside.
        </p>
      </div>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    variant: "dark",
    padding: "lg",
    children: (
      <div>
        <h3 className="text-white text-lg font-semibold mb-2">Large Padding</h3>
        <p className="text-white/70 text-sm">
          This card uses the large padding variant for more spacious content.
        </p>
      </div>
    ),
  },
};
