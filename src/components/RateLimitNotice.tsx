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
    <div className="kf:rounded-lg kf:border kf:border-yellow-200 kf:bg-yellow-50 kf:p-4">
      <div className="kf:flex kf:items-start kf:gap-3">
        <svg
          className="kf:mt-0.5 kf:h-5 kf:w-5 kf:flex-shrink-0 kf:text-yellow-600"
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
        <div className="kf:flex-1">
          <h3 className="kf:text-sm kf:font-semibold kf:text-yellow-800">
            Search Rate Limit Reached
          </h3>
          <p className="kf:mt-1 kf:text-sm kf:text-yellow-700">{message}</p>
          <p className="kf:mt-1 kf:text-xs kf:text-yellow-600">
            Current plan: <span className="kf:font-semibold kf:uppercase">{tier}</span>
          </p>
          {countdown > 0 && (
            <p className="kf:mt-2 kf:text-xs kf:text-yellow-600">
              🕐 You can search again in <strong>{countdown} seconds</strong>
            </p>
          )}
          <a
            href={upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="kf:mt-3 kf:inline-block kf:rounded kf:bg-yellow-600 kf:px-3 kf:py-1.5 kf:text-xs kf:font-medium kf:text-white kf:transition-colors kf:hover:bg-yellow-700"
          >
            Upgrade for Higher Limits
          </a>
        </div>
      </div>
    </div>
  );
};
