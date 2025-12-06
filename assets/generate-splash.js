// REMODELY Splash Screen Generator
// Run: node assets/generate-splash.js
// Requires: npm install canvas

const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Splash screen dimensions (iPhone 14 Pro Max / typical tall phone)
const WIDTH = 1284;
const HEIGHT = 2778;

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// Background - Brand Blue (#2563eb)
ctx.fillStyle = '#2563eb';
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// REMODELY text - centered
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Main title - REMODELY
ctx.font = '300 96px -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif';
ctx.letterSpacing = '8px';
ctx.fillText('REMODELY', WIDTH / 2, HEIGHT / 2 - 30);

// Tagline - below the title
ctx.font = '400 28px -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif';
ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
ctx.fillText('Remodel Locally. Source Intelligently.', WIDTH / 2, HEIGHT / 2 + 50);

// Save PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'splash.png'), buffer);
console.log('Splash screen generated: assets/splash.png (1284x2778)');
