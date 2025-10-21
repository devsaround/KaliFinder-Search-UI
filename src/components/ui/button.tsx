import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'kf:inline-flex kf:items-center kf:justify-center kf:gap-2 kf:whitespace-nowrap kf:rounded-md kf:text-sm kf:font-medium kf:ring-offset-background kf:transition-colors kf:focus-visible:outline-none kf:focus-visible:ring-2 kf:focus-visible:ring-ring kf:focus-visible:ring-offset-2 kf:disabled:pointer-events-none kf:disabled:opacity-50 kf:[&_svg]:pointer-events-none kf:[&_svg]:size-4 kf:[&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'kf:bg-primary kf:text-primary-foreground kf:hover:bg-primary/90',
        destructive: 'kf:bg-destructive kf:text-destructive-foreground kf:hover:bg-destructive/90',
        outline:
          'kf:border kf:border-input kf:bg-background kf:hover:bg-accent kf:hover:text-accent-foreground',
        secondary: 'kf:bg-secondary kf:text-secondary-foreground kf:hover:bg-secondary/80',
        ghost: 'kf:hover:bg-accent kf:hover:text-accent-foreground',
        link: 'kf:text-primary kf:underline-offset-4 kf:hover:underline',
      },
      size: {
        default: 'kf:h-10 kf:px-4 kf:py-2',
        sm: 'kf:h-9 kf:rounded-md kf:px-3',
        lg: 'kf:h-11 kf:rounded-md kf:px-8',
        icon: 'kf:h-10 kf:w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
