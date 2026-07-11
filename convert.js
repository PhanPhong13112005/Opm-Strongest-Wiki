import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const files = [
  { in: 'Tatsumaki_Terrible Tornado.png', out: 'tatsumaki.webp' },
  { in: 'Zombieman.png', out: 'zombieman.webp' },
  { in: 'Atomic Samurai.png', out: 'atomic_samurai.webp' }
];

const dir = path.join(process.cwd(), 'public', 'characters');

async function convert() {
  for (const file of files) {
    const inputPath = path.join(dir, file.in);
    const outputPath = path.join(dir, file.out);
    
    if (fs.existsSync(inputPath)) {
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
      console.log(`Converted ${file.in} to ${file.out}`);
    } else {
      console.log(`File not found: ${inputPath}`);
    }
  }
}

convert();
