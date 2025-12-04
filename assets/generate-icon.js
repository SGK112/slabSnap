// FlipStock App Icon Generator
// Run: node assets/generate-icon.js
// Requires: npm install canvas

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 1024;
const canvas = createCanvas(SIZE, SIZE);
const ctx = canvas.getContext('2d');

// Background gradient (teal/green gradient)
const gradient = ctx.createLinearGradient(0, 0, SIZE, SIZE);
gradient.addColorStop(0, '#0D9488');  // teal-600
gradient.addColorStop(1, '#115E59');  // teal-800
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, SIZE, SIZE);

// Draw stylized "F" with an arrow (flip concept)
ctx.fillStyle = '#ffffff';

// Main "F" letter
const padding = SIZE * 0.15;
const letterWidth = SIZE * 0.5;
const letterHeight = SIZE * 0.7;
const strokeWidth = SIZE * 0.12;
const startX = (SIZE - letterWidth) / 2;
const startY = (SIZE - letterHeight) / 2;

// Vertical bar of F
ctx.fillRect(startX, startY, strokeWidth, letterHeight);

// Top horizontal bar of F
ctx.fillRect(startX, startY, letterWidth, strokeWidth);

// Middle horizontal bar of F (shorter)
ctx.fillRect(startX, startY + letterHeight * 0.4, letterWidth * 0.7, strokeWidth);

// Draw circular arrows around the F (flip/recycle concept)
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = SIZE * 0.04;
ctx.lineCap = 'round';

// Top-right arrow curve
ctx.beginPath();
ctx.arc(SIZE * 0.75, SIZE * 0.25, SIZE * 0.1, Math.PI * 1.5, Math.PI * 0.5, false);
ctx.stroke();

// Arrow head top-right
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.moveTo(SIZE * 0.85, SIZE * 0.25);
ctx.lineTo(SIZE * 0.78, SIZE * 0.18);
ctx.lineTo(SIZE * 0.78, SIZE * 0.32);
ctx.closePath();
ctx.fill();

// Bottom-left arrow curve
ctx.beginPath();
ctx.arc(SIZE * 0.25, SIZE * 0.75, SIZE * 0.1, Math.PI * 0.5, Math.PI * 1.5, false);
ctx.stroke();

// Arrow head bottom-left
ctx.beginPath();
ctx.moveTo(SIZE * 0.15, SIZE * 0.75);
ctx.lineTo(SIZE * 0.22, SIZE * 0.68);
ctx.lineTo(SIZE * 0.22, SIZE * 0.82);
ctx.closePath();
ctx.fill();

// Save PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'icon.png'), buffer);
console.log('Icon generated: assets/icon.png (1024x1024)');

// Create adaptive icon (foreground only)
const adaptiveCanvas = createCanvas(SIZE, SIZE);
const adaptiveCtx = adaptiveCanvas.getContext('2d');

// Transparent background for adaptive icon
adaptiveCtx.clearRect(0, 0, SIZE, SIZE);

// Same F and arrows but white on transparent
adaptiveCtx.fillStyle = '#ffffff';
adaptiveCtx.fillRect(startX, startY, strokeWidth, letterHeight);
adaptiveCtx.fillRect(startX, startY, letterWidth, strokeWidth);
adaptiveCtx.fillRect(startX, startY + letterHeight * 0.4, letterWidth * 0.7, strokeWidth);

adaptiveCtx.strokeStyle = '#ffffff';
adaptiveCtx.lineWidth = SIZE * 0.04;
adaptiveCtx.lineCap = 'round';

adaptiveCtx.beginPath();
adaptiveCtx.arc(SIZE * 0.75, SIZE * 0.25, SIZE * 0.1, Math.PI * 1.5, Math.PI * 0.5, false);
adaptiveCtx.stroke();

adaptiveCtx.fillStyle = '#ffffff';
adaptiveCtx.beginPath();
adaptiveCtx.moveTo(SIZE * 0.85, SIZE * 0.25);
adaptiveCtx.lineTo(SIZE * 0.78, SIZE * 0.18);
adaptiveCtx.lineTo(SIZE * 0.78, SIZE * 0.32);
adaptiveCtx.closePath();
adaptiveCtx.fill();

adaptiveCtx.beginPath();
adaptiveCtx.arc(SIZE * 0.25, SIZE * 0.75, SIZE * 0.1, Math.PI * 0.5, Math.PI * 1.5, false);
adaptiveCtx.stroke();

adaptiveCtx.beginPath();
adaptiveCtx.moveTo(SIZE * 0.15, SIZE * 0.75);
adaptiveCtx.lineTo(SIZE * 0.22, SIZE * 0.68);
adaptiveCtx.lineTo(SIZE * 0.22, SIZE * 0.82);
adaptiveCtx.closePath();
adaptiveCtx.fill();

const adaptiveBuffer = adaptiveCanvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'adaptive-icon.png'), adaptiveBuffer);
console.log('Adaptive icon generated: assets/adaptive-icon.png');
