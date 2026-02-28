import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { IconBadge } from "./icon-badge";

const meta = {
  title: "Orbyto/IconBadge",
  component: IconBadge,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#1b1b1b" },
        { name: "surface", value: "#161616" },
      ],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "glass", "solid"],
      description: "The visual style of the icon badge",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the icon badge",
    },
    animated: {
      control: "boolean",
      description: "Whether the badge has hover animations",
    },
  },
} satisfies Meta<typeof IconBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const LightningIcon = () => (
  <svg
    className="w-6 h-6 text-green-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="w-6 h-6 text-gray-700"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ZoomIcon = () => (
  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
    Z
  </div>
);

export const Default: Story = {
  args: {
    variant: "default",
    size: "md",
    icon: <LightningIcon />,
  },
};

export const Glass: Story = {
  args: {
    variant: "glass",
    size: "md",
    icon: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
};

export const Solid: Story = {
  args: {
    variant: "solid",
    size: "md",
    icon: <CalendarIcon />,
  },
};

export const Animated: Story = {
  args: {
    variant: "default",
    size: "md",
    animated: true,
    icon: <LightningIcon />,
  },
};

export const Small: Story = {
  args: {
    variant: "default",
    size: "sm",
    icon: (
      <svg
        className="w-4 h-4 text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
};

export const Large: Story = {
  args: {
    variant: "default",
    size: "lg",
    icon: (
      <svg
        className="w-8 h-8 text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
};

export const IntegrationIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <IconBadge variant="default" size="md" animated icon={<ZoomIcon />} />
      <IconBadge variant="default" size="md" animated icon={<CalendarIcon />} />
      <IconBadge
        variant="default"
        size="md"
        animated
        icon={
          <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
            N
          </div>
        }
      />
      <IconBadge
        variant="default"
        size="md"
        animated
        icon={
          <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
        }
      />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-end">
      <IconBadge
        variant="default"
        size="sm"
        icon={
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        }
      />
      <IconBadge variant="default" size="md" icon={<LightningIcon />} />
      <IconBadge
        variant="default"
        size="lg"
        icon={
          <svg
            className="w-8 h-8 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        }
      />
    </div>
  ),
};
