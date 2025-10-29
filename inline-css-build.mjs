#!/usr/bin/env node

/**
 * Post-build script to inline CSS into the JavaScript bundle for Shadow DOM
 * This ensures the widget is a single self-contained file
 */

/* eslint-disable no-console, no-undef */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, 'dist');
const jsFile = join(distDir, 'kalifind-search.js');
const cssFile = join(distDir, 'kalifind-search.css');

console.log('📦 Inlining CSS into JavaScript bundle for Shadow DOM...');

// Check if files exist
if (!existsSync(jsFile)) {
    console.error(`❌ JavaScript file not found: ${jsFile}`);
    process.exit(1);
}

if (!existsSync(cssFile)) {
    console.error(`❌ CSS file not found: ${cssFile}`);
    process.exit(1);
}

// Read files
const jsContent = readFileSync(jsFile, 'utf-8');
const cssContent = readFileSync(cssFile, 'utf-8');

// Escape CSS for embedding in JS string (for template literals)
const escapedCss = cssContent
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

// Prepend the CSS constant at the beginning of the bundle
// This ensures it's available when the Shadow DOM code runs
const cssDeclaration = `const __WIDGET_CSS__ = \`${escapedCss}\`;\n`;
const updatedJs = cssDeclaration + jsContent;

// Write updated JS
writeFileSync(jsFile, updatedJs, 'utf-8');

// Delete the separate CSS file since it's now inlined
unlinkSync(cssFile);

console.log('✅ CSS successfully inlined into JavaScript bundle');
console.log(`📄 Output: ${jsFile}`);
console.log(`🗑️  Removed: ${cssFile}`);
