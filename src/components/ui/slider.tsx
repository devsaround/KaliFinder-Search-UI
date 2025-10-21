import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'kf:relative kf:flex kf:w-full kf:touch-none kf:items-center kf:select-none',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="kf:bg-secondary kf:relative kf:h-2 kf:w-full kf:grow kf:overflow-hidden kf:rounded-full">
      <SliderPrimitive.Range className="kf:bg-primary kf:absolute kf:h-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="kf:border-primary kf:bg-background kf:ring-offset-background kf:focus-visible:ring-ring kf:block kf:h-5 kf:w-5 kf:rounded-full kf:border-2 kf:transition-colors kf:focus-visible:ring-2 kf:focus-visible:ring-offset-2 kf:focus-visible:outline-none kf:disabled:pointer-events-none kf:disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
