// Remodely App Icon Generator
// Run: node assets/generate-icon.js
// Requires: npm install canvas

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 1024;
const canvas = createCanvas(SIZE, SIZE);
const ctx = canvas.getContext('2d');

// Burnt orange background with rounded corners
const BURNT_ORANGE = '#FF6B35';
const DARK_ORANGE = '#E55A2B';
const cornerRadius = 180;

// Draw rounded rectangle background
ctx.beginPath();
ctx.moveTo(cornerRadius, 0);
ctx.lineTo(SIZE - cornerRadius, 0);
ctx.quadraticCurveTo(SIZE, 0, SIZE, cornerRadius);
ctx.lineTo(SIZE, SIZE - cornerRadius);
ctx.quadraticCurveTo(SIZE, SIZE, SIZE - cornerRadius, SIZE);
ctx.lineTo(cornerRadius, SIZE);
ctx.quadraticCurveTo(0, SIZE, 0, SIZE - cornerRadius);
ctx.lineTo(0, cornerRadius);
ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
ctx.closePath();
ctx.fillStyle = BURNT_ORANGE;
ctx.fill();

// Draw shadow for house
ctx.fillStyle = DARK_ORANGE;
ctx.globalAlpha = 0.4;
ctx.beginPath();
ctx.moveTo(512, 215);
ctx.lineTo(210, 490);
ctx.lineTo(290, 490);
ctx.lineTo(290, 810);
ctx.lineTo(754, 810);
ctx.lineTo(754, 490);
ctx.lineTo(834, 490);
ctx.closePath();
ctx.fill();
ctx.globalAlpha = 1.0;

// Draw house shape - white
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.moveTo(512, 200);
ctx.lineTo(200, 480);
ctx.lineTo(280, 480);
ctx.lineTo(280, 800);
ctx.lineTo(744, 800);
ctx.lineTo(744, 480);
ctx.lineTo(824, 480);
ctx.closePath();
ctx.fill();

// Chimney
ctx.beginPath();
ctx.roundRect(620, 280, 60, 120, 4);
ctx.fill();

// Door - burnt orange
ctx.fillStyle = BURNT_ORANGE;
ctx.beginPath();
ctx.roundRect(452, 580, 120, 220, 8);
ctx.fill();

// Door knob - white
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.arc(540, 700, 12, 0, Math.PI * 2);
ctx.fill();

// Windows - burnt orange
ctx.fillStyle = BURNT_ORANGE;
ctx.beginPath();
ctx.roundRect(310, 520, 100, 100, 6);
ctx.fill();
ctx.beginPath();
ctx.roundRect(614, 520, 100, 100, 6);
ctx.fill();

// Window panes - white
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 4;

// Left window panes
ctx.beginPath();
ctx.moveTo(360, 520);
ctx.lineTo(360, 620);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(310, 570);
ctx.lineTo(410, 570);
ctx.stroke();

// Right window panes
ctx.beginPath();
ctx.moveTo(664, 520);
ctx.lineTo(664, 620);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(614, 570);
ctx.lineTo(714, 570);
ctx.stroke();

// Save PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'icon.png'), buffer);
console.log('Icon generated: assets/icon.png (1024x1024)');

// Create adaptive icon (white house on transparent for Android)
const adaptiveCanvas = createCanvas(SIZE, SIZE);
const adaptiveCtx = adaptiveCanvas.getContext('2d');
adaptiveCtx.clearRect(0, 0, SIZE, SIZE);

// Draw white house on transparent background
adaptiveCtx.fillStyle = '#ffffff';
adaptiveCtx.beginPath();
adaptiveCtx.moveTo(512, 200);
adaptiveCtx.lineTo(200, 480);
adaptiveCtx.lineTo(280, 480);
adaptiveCtx.lineTo(280, 800);
adaptiveCtx.lineTo(744, 800);
adaptiveCtx.lineTo(744, 480);
adaptiveCtx.lineTo(824, 480);
adaptiveCtx.closePath();
adaptiveCtx.fill();

// Chimney
adaptiveCtx.beginPath();
adaptiveCtx.roundRect(620, 280, 60, 120, 4);
adaptiveCtx.fill();

// Door outline
adaptiveCtx.strokeStyle = '#ffffff';
adaptiveCtx.lineWidth = 8;
adaptiveCtx.beginPath();
adaptiveCtx.roundRect(452, 580, 120, 220, 8);
adaptiveCtx.stroke();

// Door knob
adaptiveCtx.fillStyle = '#ffffff';
adaptiveCtx.beginPath();
adaptiveCtx.arc(540, 700, 12, 0, Math.PI * 2);
adaptiveCtx.fill();

// Windows outline
adaptiveCtx.beginPath();
adaptiveCtx.roundRect(310, 520, 100, 100, 6);
adaptiveCtx.stroke();
adaptiveCtx.beginPath();
adaptiveCtx.roundRect(614, 520, 100, 100, 6);
adaptiveCtx.stroke();

const adaptiveBuffer = adaptiveCanvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'adaptive-icon.png'), adaptiveBuffer);
console.log('Adaptive icon generated: assets/adaptive-icon.png');
