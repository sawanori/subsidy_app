import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);

@Injectable()
export class StorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async saveFile(filename: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);
    await writeFile(filePath, buffer);
    return filePath;
  }

  async readFile(filename: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, filename);
    return await readFile(filePath);
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);
    if (await exists(filePath)) {
      await unlink(filePath);
    }
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }
}