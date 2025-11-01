import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import * as React from 'react';

import { useShadowRoot } from '@/contexts/ShadowRootContext';
import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'kf:focus:bg-accent kf:data-[state=open]:bg-accent kf:flex kf:cursor-default kf:items-center kf:rounded-sm kf:px-2 kf:py-1.5 kf:text-sm kf:outline-none kf:select-none',
      inset && 'kf:pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="kf:ml-auto kf:h-4 kf:w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'kf:bg-popover kf:text-popover-foreground kf:data-[state=open]:animate-in kf:data-[state=closed]:animate-out kf:data-[state=closed]:fade-out-0 kf:data-[state=open]:fade-in-0 kf:data-[state=closed]:zoom-out-95 kf:data-[state=open]:zoom-in-95 kf:data-[side=bottom]:slide-in-from-top-2 kf:data-[side=left]:slide-in-from-right-2 kf:data-[side=right]:slide-in-from-left-2 kf:data-[side=top]:slide-in-from-bottom-2 kf:z-50 kf:min-w-[8rem] kf:overflow-hidden kf:rounded-md kf:border kf:p-1 kf:shadow-lg',
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  // Use shadow root container for portal rendering to ensure styles apply
  const { container } = useShadowRoot();

  return (
    <DropdownMenuPortal container={container}>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'kf:bg-popover kf:text-popover-foreground kf:data-[state=open]:animate-in kf:data-[state=closed]:animate-out kf:data-[state=closed]:fade-out-0 kf:data-[state=open]:fade-in-0 kf:data-[state=closed]:zoom-out-95 kf:data-[state=open]:zoom-in-95 kf:data-[side=bottom]:slide-in-from-top-2 kf:data-[side=left]:slide-in-from-right-2 kf:data-[side=right]:slide-in-from-left-2 kf:data-[side=top]:slide-in-from-bottom-2 kf:z-50 kf:min-w-[8rem] kf:overflow-hidden kf:rounded-md kf:border kf:p-1 kf:shadow-lg kf:md:min-w-[10rem]',
          className
        )}
        {...props}
      />
    </DropdownMenuPortal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'kf:relative kf:flex kf:cursor-default kf:select-none kf:items-center kf:rounded-sm kf:px-2 kf:py-1.5 kf:text-sm kf:outline-none kf:transition-colors kf:focus:bg-accent kf:focus:text-accent-foreground kf:hover:bg-accent kf:hover:text-accent-foreground kf:data-[disabled]:pointer-events-none kf:data-[disabled]:opacity-50',
      inset && 'kf:pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'kf:relative kf:flex kf:cursor-default kf:select-none kf:items-center kf:rounded-sm kf:py-1.5 kf:pl-8 kf:pr-2 kf:text-sm kf:outline-none kf:transition-colors kf:focus:bg-accent kf:focus:text-accent-foreground kf:hover:bg-accent kf:hover:text-accent-foreground kf:data-[disabled]:pointer-events-none kf:data-[disabled]:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="kf:absolute kf:left-2 kf:flex kf:h-3.5 kf:w-3.5 kf:items-center kf:justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="kf:h-4 kf:w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'kf:relative kf:flex kf:cursor-default kf:select-none kf:items-center kf:rounded-sm kf:py-1.5 kf:pl-8 kf:pr-2 kf:text-sm kf:outline-none kf:transition-colors kf:focus:bg-accent kf:focus:text-accent-foreground kf:hover:bg-accent kf:hover:text-accent-foreground kf:data-[disabled]:pointer-events-none kf:data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="kf:absolute kf:left-2 kf:flex kf:h-3.5 kf:w-3.5 kf:items-center kf:justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="kf:h-2 kf:w-2 kf:fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'kf:px-2 kf:py-1.5 kf:text-sm kf:font-semibold kf:select-none',
      inset && 'kf:pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('kf:-mx-1 kf:my-1 kf:h-px kf:bg-muted', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('kf:ml-auto kf:text-xs kf:tracking-widest kf:opacity-60', className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
