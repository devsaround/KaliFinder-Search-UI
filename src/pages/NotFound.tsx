import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="space-y-6 px-4 text-center">
        <div className="space-y-2">
          <h1 className="text-primary text-6xl font-bold">404</h1>
          <h2 className="text-foreground text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground mx-auto max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="border-border text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-6 py-3 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
