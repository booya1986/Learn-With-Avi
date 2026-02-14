import type { Meta, StoryObj } from "@storybook/react";

import { Avatar, AvatarGroup } from "./avatar";

const meta = {
  title: "Orbyto/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "solid", "ring"],
      description: "The visual style of the avatar border",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "The size of the avatar",
    },
    src: {
      control: "text",
      description: "Image source URL",
    },
    alt: {
      control: "text",
      description: "Alternative text for the image",
    },
    fallback: {
      control: "text",
      description: "Fallback text when image fails to load",
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    alt: "User avatar",
    variant: "default",
    size: "md",
  },
};

export const WithRing: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    alt: "User with ring",
    variant: "ring",
    size: "md",
  },
};

export const SolidBorder: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bandit",
    alt: "User with solid border",
    variant: "solid",
    size: "md",
  },
};

export const Small: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bubbles",
    alt: "Small avatar",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe",
    alt: "Large avatar",
    size: "lg",
  },
};

export const ExtraLarge: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Coco",
    alt: "Extra large avatar",
    size: "xl",
  },
};

export const WithFallback: Story = {
  args: {
    src: "https://invalid-url.com/image.jpg",
    alt: "User with fallback",
    fallback: "JD",
    size: "lg",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-end">
      <Avatar
        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Small"
        alt="Small"
        size="sm"
      />
      <Avatar
        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Medium"
        alt="Medium"
        size="md"
      />
      <Avatar
        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Large"
        alt="Large"
        size="lg"
      />
      <Avatar
        src="https://api.dicebear.com/7.x/avataaars/svg?seed=XLarge"
        alt="Extra Large"
        size="xl"
      />
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User1" alt="User 1" />
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User2" alt="User 2" />
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User3" alt="User 3" />
    </AvatarGroup>
  ),
};

export const GroupWithMax: Story = {
  render: () => (
    <AvatarGroup max={3}>
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User1" alt="User 1" />
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User2" alt="User 2" />
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User3" alt="User 3" />
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User4" alt="User 4" />
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User5" alt="User 5" />
    </AvatarGroup>
  ),
};

export const GroupLarge: Story = {
  render: () => (
    <AvatarGroup size="lg">
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User1" alt="User 1" />
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User2" alt="User 2" />
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User3" alt="User 3" />
    </AvatarGroup>
  ),
};
