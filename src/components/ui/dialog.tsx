import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'kf:data-[state=open]:animate-in kf:data-[state=closed]:animate-out kf:data-[state=closed]:fade-out-0 kf:data-[state=open]:fade-in-0 kf:fixed kf:inset-0 kf:z-50 kf:bg-black/80',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'kf:bg-background kf:data-[state=open]:animate-in kf:data-[state=closed]:animate-out kf:data-[state=closed]:fade-out-0 kf:data-[state=open]:fade-in-0 kf:data-[state=closed]:zoom-out-95 kf:data-[state=open]:zoom-in-95 kf:data-[state=closed]:slide-out-to-left-1/2 kf:data-[state=closed]:slide-out-to-top-[48%] kf:data-[state=open]:slide-in-from-left-1/2 kf:data-[state=open]:slide-in-from-top-[48%] kf:fixed kf:top-[50%] kf:left-[50%] kf:z-50 kf:grid kf:w-full kf:max-w-lg kf:translate-x-[-50%] kf:translate-y-[-50%] kf:gap-4 kf:border kf:p-6 kf:shadow-lg kf:duration-200 kf:sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="kf:ring-offset-background kf:focus:ring-ring kf:data-[state=open]:bg-accent kf:data-[state=open]:text-muted-foreground kf:absolute kf:top-4 kf:right-4 kf:rounded-sm kf:opacity-70 kf:transition-opacity kf:hover:opacity-100 kf:focus:ring-2 kf:focus:ring-offset-2 kf:focus:outline-none kf:disabled:pointer-events-none">
        <X className="kf:h-4 kf:w-4" />
        <span className="kf:sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('kf:flex kf:flex-col kf:space-y-1.5 kf:text-center kf:sm:text-left', className)}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'kf:flex kf:flex-col-reverse kf:sm:flex-row kf:sm:justify-end kf:sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('kf:text-lg kf:leading-none kf:font-semibold kf:tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('kf:text-sm kf:text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
