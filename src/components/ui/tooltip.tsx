import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'kf:bg-popover kf:text-popover-foreground kf:animate-in kf:fade-in-0 kf:zoom-in-95 kf:data-[state=closed]:kf:animate-out kf:data-[state=closed]:kf:fade-out-0 kf:data-[state=closed]:kf:zoom-out-95 kf:data-[side=bottom]:kf:slide-in-from-top-2 kf:data-[side=left]:kf:slide-in-from-right-2 kf:data-[side=right]:kf:slide-in-from-left-2 kf:data-[side=top]:kf:slide-in-from-bottom-2 kf:z-50 kf:overflow-hidden kf:rounded-md kf:border kf:px-3 kf:py-1.5 kf:text-sm kf:shadow-md',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
