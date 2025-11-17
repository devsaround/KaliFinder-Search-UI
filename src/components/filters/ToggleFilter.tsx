/**
 * ToggleFilter Component
 * Simple toggle switch filter
 * Used for: Featured, Sale, etc.
 */

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export interface ToggleFilterProps {
  // Identification
  id: string;
  title: string;

  // State
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;

  // Display
  description?: string;
  disabled?: boolean;
}

export const ToggleFilter: React.FC<ToggleFilterProps> = ({
  id,
  title,
  isEnabled,
  onToggle,
  description,
  disabled = false,
}) => {
  return (
    <AccordionItem value={id}>
      <AccordionTrigger className="text-foreground text-[14px] lg:text-[15px]">
        <b>{title}</b>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {description && <p className="text-muted-foreground mb-2 text-sm">{description}</p>}
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => onToggle(e.target.checked)}
              disabled={disabled}
              className="peer sr-only"
            />
            <div className="bg-muted peer peer-checked:bg-primary peer-focus:ring-primary/20 h-6 w-11 rounded-full peer-focus:ring-4 peer-focus:outline-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
          </label>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
