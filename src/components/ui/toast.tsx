import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'kf:fixed kf:top-0 kf:z-[100] kf:flex kf:max-h-screen kf:w-full kf:flex-col-reverse kf:p-4 kf:sm:top-auto kf:sm:right-0 kf:sm:bottom-0 kf:sm:flex-col kf:md:max-w-[420px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'kf:group kf:pointer-events-auto kf:relative kf:flex kf:w-full kf:items-center kf:justify-between kf:space-x-4 kf:overflow-hidden kf:rounded-md kf:border kf:p-6 kf:pr-8 kf:shadow-lg kf:transition-all kf:data-[swipe=cancel]:translate-x-0 kf:data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] kf:data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] kf:data-[swipe=move]:transition-none kf:data-[state=open]:animate-in kf:data-[state=closed]:animate-out kf:data-[swipe=end]:animate-out kf:data-[state=closed]:fade-out-80 kf:data-[state=closed]:slide-out-to-right-full kf:data-[state=open]:slide-in-from-top-full kf:data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'kf:border kf:bg-background kf:text-foreground',
        destructive:
          'kf:destructive kf:group kf:border-destructive kf:bg-destructive kf:text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'kf:ring-offset-background kf:hover:bg-secondary kf:focus:ring-ring kf:group-[.destructive]:border-muted/40 kf:group-[.destructive]:hover:border-destructive/30 kf:group-[.destructive]:hover:bg-destructive kf:group-[.destructive]:hover:text-destructive-foreground kf:group-[.destructive]:focus:ring-destructive kf:inline-flex kf:h-8 kf:shrink-0 kf:items-center kf:justify-center kf:rounded-md kf:border kf:bg-transparent kf:px-3 kf:text-sm kf:font-medium kf:transition-colors kf:focus:ring-2 kf:focus:ring-offset-2 kf:focus:outline-none kf:disabled:pointer-events-none kf:disabled:opacity-50',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'kf:text-foreground/50 kf:hover:text-foreground kf:absolute kf:top-2 kf:right-2 kf:rounded-md kf:p-1 kf:opacity-0 kf:transition-opacity kf:group-hover:opacity-100 kf:group-[.destructive]:text-red-300 kf:group-[.destructive]:hover:text-red-50 kf:focus:opacity-100 kf:focus:ring-2 kf:focus:outline-none kf:group-[.destructive]:focus:ring-red-400 kf:group-[.destructive]:focus:ring-offset-red-600',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="kf:h-4 kf:w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('kf:text-sm kf:font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('kf:text-sm kf:opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
