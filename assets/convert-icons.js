const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = __dirname;

async function convertSvgToPng(inputFile, outputFile, size = 1024) {
  const svgBuffer = fs.readFileSync(path.join(assetsDir, inputFile));

  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(assetsDir, outputFile));

  console.log(`Converted ${inputFile} -> ${outputFile} (${size}x${size})`);
}

async function main() {
  try {
    await convertSvgToPng('icon.svg', 'icon.png', 1024);
    await convertSvgToPng('adaptive-icon.svg', 'adaptive-icon.png', 1024);
    console.log('All icons converted successfully!');
  } catch (error) {
    console.error('Error converting icons:', error);
  }
}

main();
