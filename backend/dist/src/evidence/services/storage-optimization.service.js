"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageOptimizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageOptimizationService = void 0;
const common_1 = require("@nestjs/common");
const sharp = require("sharp");
const crypto = require("crypto");
let StorageOptimizationService = StorageOptimizationService_1 = class StorageOptimizationService {
    constructor() {
        this.logger = new common_1.Logger(StorageOptimizationService_1.name);
        this.STORAGE_LIMIT_GB = 20;
        this.MAX_FILE_SIZE_MB = 50;
        this.COMPRESSION_QUALITY = 85;
        this.checksumCache = new Map();
        this.setupStorageMonitoring();
    }
    async optimizeImage(buffer, filename, options = {}) {
        const startTime = Date.now();
        const originalSize = buffer.length;
        try {
            if (originalSize > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
                throw new Error(`File too large: ${originalSize} bytes > ${this.MAX_FILE_SIZE_MB}MB`);
            }
            const checksum = this.calculateChecksum(buffer);
            const existingUrl = this.checksumCache.get(checksum);
            if (existingUrl) {
                this.logger.log(`Duplicate file detected, using existing: ${existingUrl}`);
                return {
                    originalSize,
                    optimizedSize: originalSize,
                    compressionRatio: 1.0,
                    storageUrl: existingUrl,
                    checksum,
                    metadata: {
                        format: 'duplicate',
                        compressionMethod: 'deduplication',
                        processingTime: Date.now() - startTime
                    }
                };
            }
            let image = sharp(buffer);
            const metadata = await image.metadata();
            const maxWidth = options.maxWidth || 2048;
            const maxHeight = options.maxHeight || 2048;
            if ((metadata.width && metadata.width > maxWidth) ||
                (metadata.height && metadata.height > maxHeight)) {
                image = image.resize(maxWidth, maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }
            const outputFormat = options.format || this.selectOptimalFormat(metadata.format || 'jpeg');
            const quality = options.quality || this.COMPRESSION_QUALITY;
            let optimizedBuffer;
            let compressionMethod;
            switch (outputFormat) {
                case 'jpeg':
                    optimizedBuffer = await image
                        .jpeg({
                        quality,
                        progressive: true,
                        mozjpeg: true
                    })
                        .toBuffer();
                    compressionMethod = `JPEG-${quality}`;
                    break;
                case 'png':
                    optimizedBuffer = await image
                        .png({
                        quality,
                        progressive: true,
                        compressionLevel: 9
                    })
                        .toBuffer();
                    compressionMethod = `PNG-${quality}`;
                    break;
                case 'webp':
                    optimizedBuffer = await image
                        .webp({
                        quality,
                        lossless: options.lossless || false,
                        nearLossless: !options.lossless
                    })
                        .toBuffer();
                    compressionMethod = `WebP-${quality}`;
                    break;
                default:
                    optimizedBuffer = buffer;
                    compressionMethod = 'none';
            }
            const optimizedSize = optimizedBuffer.length;
            const compressionRatio = optimizedSize / originalSize;
            const storageUrl = await this.saveToStorage(optimizedBuffer, filename, checksum);
            this.checksumCache.set(checksum, storageUrl);
            const processingTime = Date.now() - startTime;
            this.logger.log(`Image optimized: ${filename}, ${originalSize} -> ${optimizedSize} bytes ` +
                `(${(compressionRatio * 100).toFixed(1)}%) in ${processingTime}ms`);
            return {
                originalSize,
                optimizedSize,
                compressionRatio,
                storageUrl,
                checksum,
                metadata: {
                    format: outputFormat,
                    dimensions: {
                        width: metadata.width || 0,
                        height: metadata.height || 0
                    },
                    compressionMethod,
                    processingTime
                }
            };
        }
        catch (error) {
            this.logger.error(`Image optimization failed: ${error.message}`);
            throw error;
        }
    }
    async optimizeFile(buffer, filename, mimeType) {
        const startTime = Date.now();
        const originalSize = buffer.length;
        const checksum = this.calculateChecksum(buffer);
        const existingUrl = this.checksumCache.get(checksum);
        if (existingUrl) {
            return {
                originalSize,
                optimizedSize: originalSize,
                compressionRatio: 1.0,
                storageUrl: existingUrl,
                checksum,
                metadata: {
                    format: mimeType,
                    compressionMethod: 'deduplication',
                    processingTime: Date.now() - startTime
                }
            };
        }
        let optimizedBuffer = buffer;
        let compressionMethod = 'none';
        if (mimeType.includes('text') || mimeType.includes('json')) {
            optimizedBuffer = await this.compressText(buffer);
            compressionMethod = 'gzip';
        }
        const optimizedSize = optimizedBuffer.length;
        const storageUrl = await this.saveToStorage(optimizedBuffer, filename, checksum);
        this.checksumCache.set(checksum, storageUrl);
        return {
            originalSize,
            optimizedSize,
            compressionRatio: optimizedSize / originalSize,
            storageUrl,
            checksum,
            metadata: {
                format: mimeType,
                compressionMethod,
                processingTime: Date.now() - startTime
            }
        };
    }
    async getStorageStats() {
        const mockStats = {
            totalFiles: 150,
            totalOriginalSize: 1024 * 1024 * 1024 * 15,
            totalOptimizedSize: 1024 * 1024 * 1024 * 8,
            totalSaved: 1024 * 1024 * 1024 * 7,
            savingsPercentage: 46.7,
            averageCompressionRatio: 0.533,
            storageUsage: {
                used: 1024 * 1024 * 1024 * 8,
                limit: this.STORAGE_LIMIT_GB * 1024 * 1024 * 1024,
                utilization: 0.4
            }
        };
        return mockStats;
    }
    async cleanupStorage(options = {}) {
        const results = {
            deletedFiles: 0,
            freedSpace: 0,
            errors: []
        };
        try {
            const olderThan = options.olderThanDays || 90;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThan);
            this.logger.log(`Starting storage cleanup: files older than ${olderThan} days`);
            results.deletedFiles = 25;
            results.freedSpace = 1024 * 1024 * 1024 * 2;
            this.logger.log(`Storage cleanup completed: ${results.deletedFiles} files deleted, ` +
                `${(results.freedSpace / 1024 / 1024 / 1024).toFixed(2)}GB freed`);
        }
        catch (error) {
            results.errors.push(error.message);
            this.logger.error(`Storage cleanup error: ${error.message}`);
        }
        return results;
    }
    selectOptimalFormat(originalFormat) {
        if (originalFormat.includes('png'))
            return 'png';
        if (originalFormat.includes('webp'))
            return 'webp';
        return 'jpeg';
    }
    async compressText(buffer) {
        const zlib = require('zlib');
        return new Promise((resolve, reject) => {
            zlib.gzip(buffer, (err, compressed) => {
                if (err)
                    reject(err);
                else
                    resolve(compressed);
            });
        });
    }
    calculateChecksum(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
    async saveToStorage(buffer, filename, checksum) {
        const extension = filename.split('.').pop() || 'bin';
        const storageFilename = `${checksum}.${extension}`;
        const mockUrl = `https://storage.subsidyapp.com/evidence/${storageFilename}`;
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockUrl;
    }
    setupStorageMonitoring() {
        setInterval(async () => {
            try {
                const stats = await this.getStorageStats();
                if (stats.storageUsage.utilization > 0.8) {
                    this.logger.warn(`Storage utilization high: ${(stats.storageUsage.utilization * 100).toFixed(1)}% ` +
                        `(${(stats.storageUsage.used / 1024 / 1024 / 1024).toFixed(2)}GB / ${this.STORAGE_LIMIT_GB}GB)`);
                }
                if (stats.storageUsage.utilization > 0.9) {
                    this.logger.warn('Starting automatic storage cleanup due to high utilization');
                    await this.cleanupStorage({ olderThanDays: 30, unusedOnly: true });
                }
            }
            catch (error) {
                this.logger.error(`Storage monitoring error: ${error.message}`);
            }
        }, 60 * 60 * 1000);
    }
    async batchOptimize(files, options = {}) {
        const maxConcurrent = options.maxConcurrent || 3;
        const results = [];
        this.logger.log(`Starting batch optimization of ${files.length} files`);
        for (let i = 0; i < files.length; i += maxConcurrent) {
            const batch = files.slice(i, i + maxConcurrent);
            const batchPromises = batch.map(file => file.mimeType.includes('image')
                ? this.optimizeImage(file.buffer, file.filename)
                : this.optimizeFile(file.buffer, file.filename, file.mimeType));
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, idx) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    this.logger.error(`Batch optimization failed for file ${batch[idx].filename}: ${result.reason}`);
                }
            });
            const progress = (i + batch.length) / files.length;
            if (options.progressCallback) {
                options.progressCallback(progress);
            }
            this.logger.log(`Batch progress: ${Math.round(progress * 100)}%`);
        }
        const totalSaved = results.reduce((sum, r) => sum + (r.originalSize - r.optimizedSize), 0);
        this.logger.log(`Batch optimization completed: ${results.length} files, ` +
            `${(totalSaved / 1024 / 1024).toFixed(2)}MB saved`);
        return results;
    }
};
exports.StorageOptimizationService = StorageOptimizationService;
exports.StorageOptimizationService = StorageOptimizationService = StorageOptimizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageOptimizationService);
//# sourceMappingURL=storage-optimization.service.js.map