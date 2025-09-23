import type { Meta, StoryObj } from '@storybook/react';
import { ErrorMessage } from '@/components/ui/error-message';

const meta = {
  title: 'UI/ErrorMessage',
  component: ErrorMessage,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Accessible error message component. WCAG 2.1 AA compliant.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['error', 'warning', 'info', 'success'],
    },
    message: {
      control: 'text',
    },
  },
} satisfies Meta<typeof ErrorMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Error: Story = {
  args: {
    variant: 'error',
    message: 'Required fields are missing.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    message: 'Please check your input.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    message: 'System maintenance notice.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    message: 'Form saved successfully.',
  },
};
