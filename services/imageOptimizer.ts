import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  progressive?: boolean;
  grayscale?: boolean;
}

interface OptimizedImageResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: { width: number; height: number };
  path: string;
}

class ImageOptimizationService {
  private static instance: ImageOptimizationService;
  private supportedFormats = ['webp', 'jpeg', 'png', 'avif'];
  private defaultOptions: ImageOptimizationOptions = {
    quality: 80,
    format: 'webp',
    progressive: true
  };

  static getInstance(): ImageOptimizationService {
    if (!ImageOptimizationService.instance) {
      ImageOptimizationService.instance = new ImageOptimizationService();
    }
    return ImageOptimizationService.instance;
  }

  // Optimize a single image
  async optimizeImage(
    inputPath: string,
    outputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Get original file stats
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      // Get original image metadata
      const metadata = await sharp(inputPath).metadata();
      
      // Create output directory if it doesn't exist
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Build sharp pipeline
      let pipeline = sharp(inputPath);

      // Resize if dimensions are specified
      if (opts.width || opts.height) {
        pipeline = pipeline.resize(opts.width, opts.height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Apply grayscale if requested
      if (opts.grayscale) {
        pipeline = pipeline.grayscale();
      }

      // Apply format-specific optimizations
      switch (opts.format) {
        case 'webp':
          pipeline = pipeline.webp({
            quality: opts.quality,
            progressive: opts.progressive
          });
          break;
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality: opts.quality,
            progressive: opts.progressive,
            mozjpeg: true
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            quality: opts.quality,
            progressive: opts.progressive,
            compressionLevel: 9
          });
          break;
        case 'avif':
          pipeline = pipeline.avif({
            quality: opts.quality
          });
          break;
      }

      // Process the image
      await pipeline.toFile(outputPath);

      // Get optimized file stats
      const optimizedStats = await fs.stat(outputPath);
      const optimizedSize = optimizedStats.size;

      // Get final dimensions
      const finalMetadata = await sharp(outputPath).metadata();

      return {
        originalSize,
        optimizedSize,
        compressionRatio: ((originalSize - optimizedSize) / originalSize) * 100,
        format: opts.format!,
        dimensions: {
          width: finalMetadata.width!,
          height: finalMetadata.height!
        },
        path: outputPath
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate responsive images
  async generateResponsiveImages(
    inputPath: string,
    outputDir: string,
    baseName: string,
    sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
  ): Promise<OptimizedImageResult[]> {
    const results: OptimizedImageResult[] = [];

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `${baseName}_${size}w.webp`);
      
      try {
        const result = await this.optimizeImage(inputPath, outputPath, {
          width: size,
          format: 'webp',
          quality: 85
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate ${size}w image:`, error);
      }
    }

    return results;
  }

  // Generate multiple formats for the same image
  async generateMultipleFormats(
    inputPath: string,
    outputDir: string,
    baseName: string,
    formats: string[] = ['webp', 'jpeg', 'png']
  ): Promise<OptimizedImageResult[]> {
    const results: OptimizedImageResult[] = [];

    for (const format of formats) {
      if (!this.supportedFormats.includes(format)) {
        console.warn(`Unsupported format: ${format}`);
        continue;
      }

      const outputPath = path.join(outputDir, `${baseName}.${format}`);
      
      try {
        const result = await this.optimizeImage(inputPath, outputPath, {
          format: format as any,
          quality: format === 'webp' ? 85 : 80
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate ${format} image:`, error);
      }
    }

    return results;
  }

  // Create a placeholder image
  async createPlaceholder(
    width: number,
    height: number,
    outputPath: string,
    options: { backgroundColor?: string; text?: string; textColor?: string } = {}
  ): Promise<OptimizedImageResult> {
    const {
      backgroundColor = '#f3f4f6',
      text = `${width}×${height}`,
      textColor = '#6b7280'
    } = options;

    try {
      // Create a simple placeholder image
      const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${backgroundColor}"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="${textColor}">${text}</text>
        </svg>
      `;

      await sharp(Buffer.from(svg))
        .webp({ quality: 80 })
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);

      return {
        originalSize: 0,
        optimizedSize: stats.size,
        compressionRatio: 0,
        format: 'webp',
        dimensions: { width, height },
        path: outputPath
      };
    } catch (error) {
      console.error('Placeholder creation failed:', error);
      throw new Error(`Failed to create placeholder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Batch optimize images in a directory
  async batchOptimize(
    inputDir: string,
    outputDir: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult[]> {
    const results: OptimizedImageResult[] = [];
    
    try {
      const files = await fs.readdir(inputDir);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(file)
      );

      for (const file of imageFiles) {
        const inputPath = path.join(inputDir, file);
        const baseName = path.parse(file).name;
        const outputPath = path.join(outputDir, `${baseName}.${options.format || 'webp'}`);

        try {
          const result = await this.optimizeImage(inputPath, outputPath, options);
          results.push(result);
          console.log(`✅ Optimized: ${file} (${result.compressionRatio.toFixed(1)}% reduction)`);
        } catch (error) {
          console.error(`❌ Failed to optimize ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Batch optimization failed:', error);
    }

    return results;
  }

  // Get image metadata without processing
  async getImageMetadata(imagePath: string): Promise<any> {
    try {
      return await sharp(imagePath).metadata();
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      throw error;
    }
  }

  // Validate image file
  async validateImage(imagePath: string): Promise<boolean> {
    try {
      await sharp(imagePath).metadata();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export const imageOptimizer = ImageOptimizationService.getInstance();

// Express middleware for image optimization
export const imageOptimizationMiddleware = (options: ImageOptimizationOptions = {}) => {
  return async (req: any, res: any, next: any) => {
    // This would be used for on-the-fly image optimization
    // Implementation depends on your specific needs
    next();
  };
};

export default imageOptimizer;
