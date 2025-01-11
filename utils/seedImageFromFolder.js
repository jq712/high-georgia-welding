import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import Image from '../models/Image';

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
