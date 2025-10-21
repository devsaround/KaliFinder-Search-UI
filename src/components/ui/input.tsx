import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'kf:border-input kf:bg-background kf:ring-offset-background kf:file:text-foreground kf:placeholder:text-muted-foreground kf:focus-visible:ring-ring kf:flex kf:h-10 kf:w-full kf:rounded-md kf:border kf:px-3 kf:py-2 kf:text-base kf:file:border-0 kf:file:bg-transparent kf:file:text-sm kf:file:font-medium kf:focus-visible:ring-2 kf:focus-visible:ring-offset-2 kf:focus-visible:outline-none kf:disabled:cursor-not-allowed kf:disabled:opacity-50 kf:md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
