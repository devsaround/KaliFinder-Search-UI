/**
 * SortDropdown Component
 * Dropdown for sorting products
 */

import React from 'react';
import { ChevronDown } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type SortOption = 'default' | 'a-z' | 'z-a' | 'price-asc' | 'price-desc';

export interface SortDropdownProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
  className?: string;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'default', label: 'Relevance' },
  { value: 'a-z', label: 'Name: A-Z' },
  { value: 'z-a', label: 'Name: Z-A' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const getSortLabel = (option: SortOption): string => {
  const found = SORT_OPTIONS.find((opt) => opt.value === option);
  return found?.label || 'Relevance';
};

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange, className = '' }) => {
  return (
    <div onClick={(e) => e.stopPropagation()} className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="border-border text-foreground hover:bg-muted flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors md:px-3 md:py-2 lg:text-sm">
            <span className="font-medium">{getSortLabel(value)}</span>
            <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-background border-border z-[2147483647] min-w-[180px]"
        >
          <DropdownMenuLabel className="text-foreground text-sm font-semibold">
            Sort by
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={(e) => {
                e.preventDefault();
                onChange(option.value);
              }}
              className={`text-sm ${value === option.value ? 'bg-muted font-semibold' : ''}`}
            >
              {value === option.value && <span className="mr-2">✓</span>}
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
