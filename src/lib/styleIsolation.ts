// Style isolation utilities for WordPress integration

export const injectIsolatedStyles = (container: HTMLElement) => {
  // Create a style element with scoped styles
  const styleElement = document.createElement("style");
  styleElement.id = "kalifind-isolated-styles";

  styleElement.textContent = `
    /* Kalifind Search Widget - Isolated Styles */
    .kalifind-search-widget {
      /* Complete style reset */
      all: initial !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 16px !important;
      line-height: 1.5 !important;
      color: #1f2937 !important;
      background-color: #ffffff !important;
      box-sizing: border-box !important;
      display: block !important;
      position: relative !important;
      z-index: 999999 !important;
    }

    /* Reset all child elements */
    .kalifind-search-widget *,
    .kalifind-search-widget *::before,
    .kalifind-search-widget *::after {
      all: unset !important;
      display: revert !important;
      box-sizing: border-box !important;
      font-family: inherit !important;
      line-height: inherit !important;
      color: inherit !important;
      background: transparent !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
      filter: none !important;
      transform: none !important;
      transition: none !important;
      animation: none !important;
    }

    /* Restore necessary display properties */
    .kalifind-search-widget div { display: block !important; }
    .kalifind-search-widget span { display: inline !important; }
    .kalifind-search-widget button { 
      display: inline-block !important; 
      cursor: pointer !important;
    }
    .kalifind-search-widget input { display: inline-block !important; }
    .kalifind-search-widget img { 
      display: block !important; 
      max-width: 100% !important; 
      height: auto !important; 
    }

    /* Tailwind CSS overrides with !important */
    .kalifind-search-widget .bg-primary { background-color: #823BED !important; }
    .kalifind-search-widget .text-primary { color: #823BED !important; }
    .kalifind-search-widget .border-primary { border-color: #823BED !important; }
    .kalifind-search-widget .bg-background { background-color: #ffffff !important; }
    .kalifind-search-widget .text-foreground { color: #1f2937 !important; }
    .kalifind-search-widget .text-muted-foreground { color: #6b7280 !important; }
    .kalifind-search-widget .border-border { border-color: #e5e7eb !important; }

    /* Grid and layout overrides */
    .kalifind-search-widget .grid { display: grid !important; }
    .kalifind-search-widget .flex { display: flex !important; }
    .kalifind-search-widget .hidden { display: none !important; }
    .kalifind-search-widget .block { display: block !important; }
    .kalifind-search-widget .inline-block { display: inline-block !important; }

    /* Spacing overrides */
    .kalifind-search-widget .p-2 { padding: 0.5rem !important; }
    .kalifind-search-widget .p-4 { padding: 1rem !important; }
    .kalifind-search-widget .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
    .kalifind-search-widget .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
    .kalifind-search-widget .m-2 { margin: 0.5rem !important; }
    .kalifind-search-widget .mb-4 { margin-bottom: 1rem !important; }

    /* Typography overrides */
    .kalifind-search-widget .text-sm { font-size: 0.875rem !important; }
    .kalifind-search-widget .text-base { font-size: 1rem !important; }
    .kalifind-search-widget .text-lg { font-size: 1.125rem !important; }
    .kalifind-search-widget .font-bold { font-weight: 700 !important; }
    .kalifind-search-widget .font-medium { font-weight: 500 !important; }

    /* Border and radius overrides */
    .kalifind-search-widget .rounded { border-radius: 0.25rem !important; }
    .kalifind-search-widget .rounded-lg { border-radius: 0.5rem !important; }
    .kalifind-search-widget .border { border-width: 1px !important; border-style: solid !important; }

    /* Hover states */
    .kalifind-search-widget .hover\\:bg-muted:hover { background-color: #f3f4f6 !important; }
    .kalifind-search-widget .hover\\:bg-primary:hover { background-color: #7c3aed !important; }

    /* Responsive overrides */
    @media (max-width: 768px) {
      .kalifind-search-widget {
        font-size: 14px !important;
      }
    }

    /* Ensure our z-index is always highest */
    .kalifind-search-widget {
      z-index: 999999 !important;
    }
  `;

  // Inject styles into document head
  document.head.appendChild(styleElement);

  return styleElement;
};

export const removeIsolatedStyles = () => {
  const styleElement = document.getElementById("kalifind-isolated-styles");
  if (styleElement) {
    styleElement.remove();
  }
};

// CSS class name generator for scoped styles
export const generateScopedClassName = (
  baseClass: string,
  scope: string = "kalifind"
) => {
  return `${scope}-${baseClass}`;
};

// Utility to apply scoped styles to elements
export const applyScopedStyles = (
  element: HTMLElement,
  scope: string = "kalifind-search-widget"
) => {
  element.classList.add(scope);

  // Apply additional isolation styles
  element.style.setProperty("all", "initial", "important");
  element.style.setProperty(
    "font-family",
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "important"
  );
  element.style.setProperty("font-size", "16px", "important");
  element.style.setProperty("line-height", "1.5", "important");
  element.style.setProperty("color", "#1f2937", "important");
  element.style.setProperty("background-color", "#ffffff", "important");
  element.style.setProperty("box-sizing", "border-box", "important");
  element.style.setProperty("z-index", "999999", "important");
};
