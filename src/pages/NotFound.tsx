import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="kf:bg-background kf:flex kf:min-h-screen kf:items-center kf:justify-center">
      <div className="kf:space-y-6 kf:px-4 kf:text-center">
        <div className="kf:space-y-2">
          <h1 className="kf:text-primary kf:text-6xl kf:font-bold">404</h1>
          <h2 className="kf:text-foreground kf:text-2xl kf:font-semibold">Page Not Found</h2>
          <p className="kf:text-muted-foreground kf:mx-auto kf:max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="kf:flex kf:flex-col kf:justify-center kf:gap-4 kf:sm:flex-row">
          <Link
            to="/"
            className="kf:bg-primary kf:text-primary-foreground kf:hover:bg-primary-hover kf:inline-flex kf:items-center kf:gap-2 kf:rounded-lg kf:px-6 kf:py-3 kf:font-medium kf:transition-colors"
          >
            <Home className="kf:h-4 kf:w-4" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="kf:border-border kf:text-foreground kf:hover:bg-muted kf:inline-flex kf:items-center kf:gap-2 kf:rounded-lg kf:border kf:px-6 kf:py-3 kf:font-medium kf:transition-colors"
          >
            <ArrowLeft className="kf:h-4 kf:w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
