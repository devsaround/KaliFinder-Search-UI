import * as React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  count?: number;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, count, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          'hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              ref={ref}
              disabled={disabled}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              {...props}
            />
            <svg
              className="pointer-events-none absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          {label && <span className="text-sm font-medium text-gray-900 select-none">{label}</span>}
        </div>
        {count !== undefined && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {count}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
