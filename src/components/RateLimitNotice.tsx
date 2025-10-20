import React, { useEffect, useState } from 'react';

interface RateLimitNoticeProps {
  tier: string;
  retryAfter: number;
  upgradeUrl: string;
  message: string;
}

export const RateLimitNotice: React.FC<RateLimitNoticeProps> = ({
  tier,
  retryAfter,
  upgradeUrl,
  message,
}) => {
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800">Search Rate Limit Reached</h3>
          <p className="mt-1 text-sm text-yellow-700">{message}</p>
          <p className="mt-1 text-xs text-yellow-600">
            Current plan: <span className="font-semibold uppercase">{tier}</span>
          </p>
          {countdown > 0 && (
            <p className="mt-2 text-xs text-yellow-600">
              🕐 You can search again in <strong>{countdown} seconds</strong>
            </p>
          )}
          <a
            href={upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-yellow-700"
          >
            Upgrade for Higher Limits
          </a>
        </div>
      </div>
    </div>
  );
};
