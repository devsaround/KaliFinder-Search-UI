/**
 * WidgetTrigger Component
 * Minimal search icon button for embedded widget
 *
 * - Only Kalifinder search icon, no global search interception
 * - Positioned in top-right corner by default
 * - Tooltip on hover
 * - Keyboard accessible
 */

import { Search } from '@/components/icons';

interface WidgetTriggerProps {
  onClick: (e: React.MouseEvent) => void;
  storeUrl: string;
}

export default function WidgetTrigger({ onClick, storeUrl }: WidgetTriggerProps) {
  return (
    <button
      className="kalifinder-trigger-button"
      onClick={onClick}
      title={`Search products on ${new URL(storeUrl).hostname}`}
      aria-label="Open KaliFinder search"
      aria-expanded="false"
      type="button"
    >
      <Search width={24} height={24} />
      <span className="kalifinder-trigger-tooltip">Powered by KaliFinder</span>
    </button>
  );
}
