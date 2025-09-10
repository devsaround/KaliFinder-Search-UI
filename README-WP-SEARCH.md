# WordPress Search Replacer

This JavaScript solution replaces existing WordPress search functionality with your custom search implementation.

## How it works

1. Finds all elements within the `<header>` tag that have a class or ID containing "search" (case-insensitive)
2. Completely removes existing event listeners and functionality
3. Injects your custom search functionality

## Usage

### Method 1: Using the standalone JavaScript file

Include the `wordpress-search-replacer.js` file in your WordPress site:

```html
&lt;script src="path/to/wordpress-search-replacer.js"&gt;&lt;/script&gt;
```

### Method 2: Integrating with your existing search component

The functionality is already integrated into your `embed.tsx` file. When you build your project, it will automatically handle replacing WordPress search elements.

## Features

- **Thorough Event Listener Removal**: Uses element cloning to completely remove existing event listeners
- **Flexible Element Detection**: Finds elements by both ID and class names containing "search"
- **Fallback Mechanism**: Adds a search icon if no existing search elements are found
- **Accessibility Support**: Adds proper ARIA attributes and keyboard navigation
- **Conflict Prevention**: Removes existing functionality before adding new functionality

## Customization

You can customize the behavior by modifying the `wordpress-search-replacer.js` file:

- Adjust the element detection logic in `findSearchTriggerElements()`
- Modify the event removal process in `removeExistingSearch()`
- Change the injected search functionality in `injectCustomSearch()`

## How to Build

To build your search component with this integration:

```bash
npm run build:embed
```

This will generate the `kalifind-search.js` file in the `search-cdn` directory.