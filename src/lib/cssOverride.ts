// CSS override utilities for WordPress theme conflicts

export const overrideCSSVariables = () => {
  const styleElement = document.createElement("style");
  styleElement.id = "kalifind-css-override";

  styleElement.textContent = `
    /* Override WordPress theme CSS variables */
    .kalifind-search-widget {
      /* Force our CSS custom properties */
      --background: 0 0% 100% !important;
      --foreground: 222.2 84% 4.9% !important;
      --card: 0 0% 100% !important;
      --card-foreground: 222.2 84% 4.9% !important;
      --popover: 0 0% 100% !important;
      --popover-foreground: 222.2 84% 4.9% !important;
      --primary: 264 83% 58% !important;
      --primary-foreground: 0 0% 100% !important;
      --primary-hover: 264 83% 52% !important;
      --secondary: 250 7% 97% !important;
      --secondary-foreground: 222.2 47.4% 11.2% !important;
      --muted: 250 7% 97% !important;
      --muted-foreground: 215.4 16.3% 46.9% !important;
      --accent: 264 83% 95% !important;
      --accent-foreground: 264 83% 25% !important;
      --destructive: 0 84.2% 60.2% !important;
      --destructive-foreground: 210 40% 98% !important;
      --border: 220 13% 91% !important;
      --input: 220 13% 91% !important;
      --ring: 264 83% 58% !important;
      --search-highlight: 264 83% 58% !important;
      --search-bar: 0 0% 98% !important;
      --filter-bg: 0 0% 100% !important;
      --loading: 220 13% 91% !important;
      --loading-shimmer: 0 0% 98% !important;
      --radius: 0.5rem !important;
    }

    /* Override common WordPress theme classes */
    .kalifind-search-widget .wp-block,
    .kalifind-search-widget .wp-content,
    .kalifind-search-widget .entry-content,
    .kalifind-search-widget .post-content {
      all: unset !important;
      display: revert !important;
    }

    /* Override WordPress theme typography */
    .kalifind-search-widget h1,
    .kalifind-search-widget h2,
    .kalifind-search-widget h3,
    .kalifind-search-widget h4,
    .kalifind-search-widget h5,
    .kalifind-search-widget h6 {
      font-size: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Override WordPress theme buttons */
    .kalifind-search-widget .wp-block-button,
    .kalifind-search-widget .wp-block-button__link,
    .kalifind-search-widget .button,
    .kalifind-search-widget .btn {
      all: unset !important;
      display: inline-block !important;
      cursor: pointer !important;
    }

    /* Override WordPress theme forms */
    .kalifind-search-widget input,
    .kalifind-search-widget textarea,
    .kalifind-search-widget select {
      all: unset !important;
      display: inline-block !important;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
    }

    /* Override WordPress theme links */
    .kalifind-search-widget a {
      all: unset !important;
      display: inline !important;
      cursor: pointer !important;
      color: inherit !important;
      text-decoration: none !important;
    }

    /* Override WordPress theme images */
    .kalifind-search-widget img {
      all: unset !important;
      display: block !important;
      max-width: 100% !important;
      height: auto !important;
    }

    /* Override WordPress theme lists */
    .kalifind-search-widget ul,
    .kalifind-search-widget ol,
    .kalifind-search-widget li {
      all: unset !important;
      display: revert !important;
      list-style: none !important;
    }

    /* Override WordPress theme tables */
    .kalifind-search-widget table,
    .kalifind-search-widget th,
    .kalifind-search-widget td {
      all: unset !important;
      display: revert !important;
      border: none !important;
    }

    /* Override WordPress theme media queries */
    @media (max-width: 768px) {
      .kalifind-search-widget {
        font-size: 14px !important;
      }
    }

    @media (max-width: 480px) {
      .kalifind-search-widget {
        font-size: 12px !important;
      }
    }
  `;

  document.head.appendChild(styleElement);
  return styleElement;
};

export const removeCSSOverride = () => {
  const styleElement = document.getElementById("kalifind-css-override");
  if (styleElement) {
    styleElement.remove();
  }
};
