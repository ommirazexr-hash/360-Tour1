import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

export interface IStorageProvider {
  save(fileBuffer: Buffer, subPath: string): Promise<string>;
  delete(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  getPublicUrl(filePath: string): string;
  getAbsolutePath(filePath: string): string;
  getDirectorySize(dir: string): Promise<number>;
}

class LocalStorageProvider implements IStorageProvider {
  private readonly baseDir: string;

  constructor() {
    // Assets are stored inside the project directory under assets/
    this.baseDir = path.resolve(env.PROJECT_DIR, 'assets');
    // Ensure subdirectories exist
    [
      'avatars/original',
      'avatars/optimized',
      'panoramas',
      'images',
      'documents',
      'originals',
      'optimized',
      'thumbnails',
    ].forEach((sub) => {
      fs.mkdirSync(path.join(this.baseDir, sub), { recursive: true });
    });
  }

  private normalizePath(filePath: string): string {
    if (filePath.startsWith('assets/')) {
      return filePath.substring(7);
    }
    if (filePath.startsWith('assets\\')) {
      return filePath.substring(7);
    }
    return filePath;
  }

  async save(fileBuffer: Buffer, subPath: string): Promise<string> {
    const cleanSubPath = this.normalizePath(subPath);
    const absPath = path.join(this.baseDir, cleanSubPath);
    const dir = path.dirname(absPath);
    fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(absPath, fileBuffer);
    return `assets/${cleanSubPath.replace(/\\/g, '/')}`; // Return relative path from projectDir
  }

  async delete(filePath: string): Promise<void> {
    const absPath = this.getAbsolutePath(filePath);
    try {
      await fs.promises.unlink(absPath);
    } catch {
      // File may not exist — silent fail
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(this.getAbsolutePath(filePath));
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(filePath: string): string {
    const base = env.API_PUBLIC_URL.replace(/\/$/, '');
    return `${base}/uploads/${this.normalizePath(filePath).replace(/\\/g, '/')}`;
  }

  getAbsolutePath(filePath: string): string {
    return path.join(this.baseDir, this.normalizePath(filePath));
  }

  async getDirectorySize(dir: string): Promise<number> {
    const cleanDir = this.normalizePath(dir);
    const absDir = path.join(this.baseDir, cleanDir);
    let total = 0;
    try {
      const files = await fs.promises.readdir(absDir, { recursive: true });
      for (const file of files) {
        const fp = path.join(absDir, file as string);
        try {
          const stat = await fs.promises.stat(fp);
          if (stat.isFile()) total += stat.size;
        } catch { /* skip */ }
      }
    } catch { /* dir may not exist */ }
    return total;
  }
}

// Export singleton
export const storage: IStorageProvider = new LocalStorageProvider();
