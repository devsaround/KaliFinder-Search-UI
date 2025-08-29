import React from 'react';
import ReactDOM from 'react-dom/client';
import KalifindSearch from './KalifindSearch';

// Embeddable version with styles included
const EmbeddableKalifindSearch = () => {
  return (
    <>
      <style>{`
        /* Tailwind CSS styles for embeddable version */
        .kalifind-search * {
          box-sizing: border-box;
        }
        
        .kalifind-search {
          --primary: 264 83% 58%;
          --primary-foreground: 0 0% 100%;
          --primary-hover: 264 83% 52%;
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --border: 220 13% 91%;
          --muted: 250 7% 97%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --search-highlight: 129 76% 59%;
          --search-bar: 0 0% 98%;
          --filter-bg: 0 0% 100%;
          --loading: 220 13% 91%;
          --loading-shimmer: 0 0% 98%;
          --accent: 264 83% 95%;
          --accent-foreground: 264 83% 25%;
          font-family: system-ui, -apple-system, sans-serif;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      <div className="kalifind-search">
        <KalifindSearch />
      </div>
    </>
  );
};

// Function to embed the component in any HTML page
export const embedKalifindSearch = (containerId: string) => {
  const container = document.getElementById(containerId);
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<EmbeddableKalifindSearch />);
  }
};

// Auto-embed if container exists
if (typeof window !== 'undefined') {
  const autoEmbed = () => {
    const container = document.getElementById('kalifind-search-container');
    if (container) {
      embedKalifindSearch('kalifind-search-container');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoEmbed);
  } else {
    autoEmbed();
  }
}

export default EmbeddableKalifindSearch;