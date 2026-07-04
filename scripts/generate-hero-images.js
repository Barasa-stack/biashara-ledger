const fs = require('fs');
const path = require('path');

const heroDir = path.join(process.cwd(), 'public', 'images', 'hero');
const outputFile = path.join(process.cwd(), 'src', 'lib', 'hero-images.ts');

// Read all files in the hero directory
const files = fs.readdirSync(heroDir);

// Filter for image files (jpg, png, webp, etc.)
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const imageFiles = files
  .filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext) && !file.startsWith('.');
  })
  .map(file => {
    // Generate a nice label from the filename
    const name = file
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/^hero-/, '') // Remove 'hero-' prefix
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
    
    return {
      url: `/images/hero/${file}`,
      label: name
    };
  });

// Generate the TypeScript file
const content = `// Auto-generated from public/images/hero/
// Generated on: ${new Date().toISOString()}
// Total images: ${imageFiles.length}

import type { CityImage } from '@/components/PageHero';

export const heroImages: CityImage[] = ${JSON.stringify(imageFiles, null, 2)};

export default heroImages;
`;

fs.writeFileSync(outputFile, content);
console.log(`✅ Generated ${imageFiles.length} hero images in ${outputFile}`);
console.log(`\n📸 Images found:`);
imageFiles.forEach((img, i) => {
  console.log(`  ${i+1}. ${img.label}`);
});
