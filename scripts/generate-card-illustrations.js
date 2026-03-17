#!/usr/bin/env node
/**
 * Script to generate CardIllustrations.tsx from Recraft SVG files.
 * Removes the white background rectangle path from each SVG.
 *
 * Usage: node scripts/generate-card-illustrations.js
 */

const fs = require('fs');
const path = require('path');

const SVG_DIR = path.join(__dirname, '..', 'assets', 'illustrations');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'shared', 'components', 'CardIllustrations.tsx');

const illustrations = ['feeding', 'sleep', 'diaper', 'growth', 'health', 'activity'];

function removeWhiteBackground(svgContent) {
  // Remove the first <path> element that fills the entire viewBox with white/near-white
  // Pattern: <path d="M 0 0 L 2048 0 L 2048 2048 L 0 2048 L 0 0 z" fill="rgb(254,254,253)" ...></path>
  // or fill="rgb(255,255,255)"
  const bgPattern = /<path\s+d="M\s+0\s+0\s+L\s+2048\s+0\s+L\s+2048\s+2048\s+L\s+0\s+2048\s+L\s+0\s+0\s+z"\s+fill="rgb\(\d+,\d+,\d+\)"\s+transform="translate\(0,0\)"><\/path>\n?/;
  return svgContent.replace(bgPattern, '');
}

function removeMetadata(svgContent) {
  // Remove the <metadata> block with recraft signature
  return svgContent.replace(/<metadata>[\s\S]*?<\/metadata>/, '');
}

function processSvg(name) {
  const filePath = path.join(SVG_DIR, `${name}.svg`);
  let content = fs.readFileSync(filePath, 'utf-8');
  content = removeWhiteBackground(content);
  content = removeMetadata(content);
  // Trim whitespace
  content = content.trim();
  return content;
}

// Generate the TypeScript file
let output = `/* eslint-disable */
// @ts-nocheck
// ============================================================
// Lumina — Recraft-Generated Card Illustrations
// Rich, detailed SVG illustrations for dashboard cards
// AUTO-GENERATED — do not edit manually
// Regenerate: node scripts/generate-card-illustrations.js
// ============================================================

import React from 'react';
import { SvgXml } from 'react-native-svg';

interface IllustrationProps {
  size?: number;
  color?: string;
}

`;

// Add each SVG as a const
for (const name of illustrations) {
  const svg = processSvg(name);
  // Escape backticks and ${} in the SVG content
  const escaped = svg.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  output += `const ${name}Svg = \`${escaped}\`;\n\n`;
}

// Add component functions
for (const name of illustrations) {
  const componentName = name.charAt(0).toUpperCase() + name.slice(1) + 'Illustration';
  output += `function ${componentName}({ size = 52 }: IllustrationProps) {
  return <SvgXml xml={${name}Svg} width={size} height={size} />;
}

`;
}

// Add the export map
output += `export const CardIllustrationMap: Record<string, React.FC<IllustrationProps>> = {
`;
for (const name of illustrations) {
  const componentName = name.charAt(0).toUpperCase() + name.slice(1) + 'Illustration';
  output += `  ${name}: ${componentName},\n`;
}
output += `};\n`;

fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
console.log(`Generated ${OUTPUT_FILE}`);
console.log(`Total size: ${(output.length / 1024).toFixed(1)} KB`);
