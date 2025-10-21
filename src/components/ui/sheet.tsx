import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'kf:data-[state=open]:animate-in kf:data-[state=closed]:animate-out kf:data-[state=closed]:fade-out-0 kf:data-[state=open]:fade-in-0 kf:fixed kf:inset-0 kf:z-50 kf:bg-black/80',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  'kf:fixed kf:z-50 kf:gap-4 kf:bg-background kf:p-6 kf:shadow-lg kf:transition kf:ease-in-out kf:data-[state=open]:animate-in kf:data-[state=closed]:animate-out kf:data-[state=closed]:duration-300 kf:data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'kf:inset-x-0 kf:top-0 kf:border-b kf:data-[state=closed]:slide-out-to-top kf:data-[state=open]:slide-in-from-top',
        bottom:
          'kf:inset-x-0 kf:bottom-0 kf:border-t kf:data-[state=closed]:slide-out-to-bottom kf:data-[state=open]:slide-in-from-bottom',
        left: 'kf:inset-y-0 kf:left-0 kf:h-full kf:w-3/4 kf:border-r kf:data-[state=closed]:slide-out-to-left kf:data-[state=open]:slide-in-from-left kf:sm:max-w-sm',
        right:
          'kf:inset-y-0 kf:right-0 kf:h-full kf:w-3/4 kf:border-l kf:data-[state=closed]:slide-out-to-right kf:data-[state=open]:slide-in-from-right kf:sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      {children}
      <SheetPrimitive.Close className="kf:ring-offset-background kf:focus:ring-ring kf:data-[state=open]:bg-accent kf:data-[state=open]:text-muted-foreground kf:absolute kf:right-4 kf:top-4 kf:rounded-sm kf:opacity-70 kf:transition-opacity kf:hover:opacity-100 kf:focus:ring-2 kf:focus:ring-offset-2 kf:focus:outline-none kf:disabled:pointer-events-none">
        <X className="kf:h-4 kf:w-4" />
        <span className="kf:sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('kf:flex kf:flex-col kf:space-y-2 kf:text-center kf:sm:text-left', className)}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'kf:flex kf:flex-col-reverse kf:sm:flex-row kf:sm:justify-end kf:sm:space-x-2',
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('kf:text-lg kf:font-semibold kf:text-foreground', className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('kf:text-sm kf:text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
