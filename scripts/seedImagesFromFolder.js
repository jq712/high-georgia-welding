import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Image } from '../models/Image.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mapping of image numbers to their metadata
const IMAGE_METADATA = {
  '1.jpg': { category: 'structural', description: 'Custom Steel Frame Fabrication' },
  '2.jpg': { category: 'pipes', description: 'Industrial Pipeline Installation' },
  '3.jpg': { category: 'structural', description: 'Heavy-Duty Support Structure' },
  '4.jpg': { category: 'pipes', description: 'Complex Pipe System Assembly' },
  '5.jpg': { category: 'structural', description: 'Structural Steel Framework' },
  '6.jpg': { category: 'pipes', description: 'Custom Pipe Fitting Project' },
  '7.jpg': { category: 'structural', description: 'Industrial Steel Construction' },
  '8.jpg': { category: 'pipes', description: 'High-Pressure Pipeline Welding' },
  '9.jpg': { category: 'structural', description: 'Steel Beam Assembly' },
  '10.jpg': { category: 'pipes', description: 'Precision Pipe Connection' },
  '11.jpg': { category: 'structural', description: 'Metal Framework Installation' },
  '12.jpg': { category: 'pipes', description: 'Industrial Pipe Network' },
  '13.jpg': { category: 'structural', description: 'Custom Steel Support System' },
  '14.jpg': { category: 'pipes', description: 'Advanced Pipeline Fabrication' },
  '15.jpg': { category: 'structural', description: 'Structural Welding Project' },
  '16.jpg': { category: 'pipes', description: 'Large-Scale Industrial Piping' }
};

async function getImagesFromFolder() {
  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  const files = await fs.readdir(imagesDir);
  
  const images = files
    .filter(file => /\.(jpg|jpeg)$/i.test(file))
    .filter(filename => {
      if (!IMAGE_METADATA[filename]) {
        console.warn(`Warning: No metadata found for ${filename}, skipping...`);
        return false;
      }
      return true;
    })
    .map(filename => ({
      filename,
      ...IMAGE_METADATA[filename],
      path: `/images/${filename}`,
      uploadedAt: new Date()
    }));

  console.log('\nFound the following images:');
  images.forEach(img => {
    console.log(`\nFilename: ${img.filename}`);
    console.log(`Description: ${img.description}`);
    console.log(`Category: ${img.category}`);
    console.log(`Path: ${img.path}`);
  });

  return images;
}

async function seedImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const images = await getImagesFromFolder();
    console.log(`\nFound ${images.length} images in folder`);

    await Image.deleteMany({});
    console.log('Cleared existing images');

    const result = await Image.insertMany(images);
    console.log(`Added ${result.length} images to the database`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedImages();