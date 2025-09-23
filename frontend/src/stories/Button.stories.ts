import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'アクセシブルなボタンコンポーネント。WCAG 2.1 AA準拠。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'ボタンのバリエーション',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'ボタンのサイズ',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
    children: {
      control: 'text',
      description: 'ボタン内容',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'デフォルトボタン',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: '削除',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'アウトライン',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'セカンダリ',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'ゴースト',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'リンク',
  },
};

export const Disabled: Story = {
  args: {
    children: '無効ボタン',
    disabled: true,
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: '大きなボタン',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: '小さなボタン',
  },
};