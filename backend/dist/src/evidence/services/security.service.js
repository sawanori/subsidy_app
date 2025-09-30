"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var SecurityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let SecurityService = SecurityService_1 = class SecurityService {
    constructor() {
        this.logger = new common_1.Logger(SecurityService_1.name);
        this.FILE_SIGNATURES = new Map([
            ['25504446', 'application/pdf'],
            ['89504E47', 'image/png'],
            ['FFD8FF', 'image/jpeg'],
            ['504B0304', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            ['504B0304', 'application/zip'],
            ['EFBBBF', 'text/csv'],
        ]);
        this.DANGEROUS_EXTENSIONS = [
            'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
            'sh', 'py', 'pl', 'php', 'asp', 'aspx', 'jsp'
        ];
        this.ALLOWED_MIME_TYPES = [
            'text/csv',
            'application/csv',
            'text/plain',
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/bmp',
            'image/tiff',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
    }
    async scanFile(buffer, filename, mimeType, options = {}) {
        const startTime = Date.now();
        try {
            const result = {
                isSafe: true,
                fileSignatureValid: true,
                scanCompletedAt: new Date(),
                scanEngine: 'CustomSecurityService'
            };
            const maxSize = options.maxFileSize || 50 * 1024 * 1024;
            if (buffer.length > maxSize) {
                result.isSafe = false;
                result.suspiciousPatterns = result.suspiciousPatterns || [];
                result.suspiciousPatterns.push(`File too large: ${buffer.length} > ${maxSize}`);
            }
            const extension = filename.split('.').pop()?.toLowerCase();
            if (extension && this.DANGEROUS_EXTENSIONS.includes(extension)) {
                result.isSafe = false;
                result.suspiciousPatterns = result.suspiciousPatterns || [];
                result.suspiciousPatterns.push(`Dangerous file extension: ${extension}`);
            }
            if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
                result.isSafe = false;
                result.suspiciousPatterns = result.suspiciousPatterns || [];
                result.suspiciousPatterns.push(`Disallowed MIME type: ${mimeType}`);
            }
            if (options.checkFileSignature !== false) {
                const signatureValid = this.verifyFileSignature(buffer, mimeType);
                result.fileSignatureValid = signatureValid;
                if (!signatureValid) {
                    result.isSafe = false;
                    result.suspiciousPatterns = result.suspiciousPatterns || [];
                    result.suspiciousPatterns.push('File signature mismatch with MIME type');
                }
            }
            const malwarePatterns = this.scanForMalwarePatterns(buffer);
            if (malwarePatterns.length > 0) {
                result.isSafe = false;
                result.malwareSignatures = malwarePatterns;
            }
            if (options.enableVirusScan) {
                try {
                    const virusScanResult = await this.runVirusScan(buffer);
                    result.virusFound = virusScanResult.infected;
                    if (virusScanResult.infected) {
                        result.isSafe = false;
                        result.malwareSignatures = result.malwareSignatures || [];
                        result.malwareSignatures.push(...virusScanResult.viruses);
                    }
                }
                catch (error) {
                    this.logger.warn(`Virus scan failed: ${error.message}`);
                }
            }
            const contentIssues = this.scanFileContent(buffer, filename);
            if (contentIssues.length > 0) {
                result.suspiciousPatterns = result.suspiciousPatterns || [];
                result.suspiciousPatterns.push(...contentIssues);
            }
            const scanTime = Date.now() - startTime;
            this.logger.log(`Security scan completed in ${scanTime}ms, safe: ${result.isSafe}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Security scan failed: ${error.message}`);
            return {
                isSafe: false,
                fileSignatureValid: false,
                scanCompletedAt: new Date(),
                scanEngine: 'CustomSecurityService',
                suspiciousPatterns: [`Security scan error: ${error.message}`]
            };
        }
    }
    verifyFileSignature(buffer, mimeType) {
        if (buffer.length < 4)
            return false;
        const signature = buffer.subarray(0, 4).toString('hex').toUpperCase();
        const signature3 = buffer.subarray(0, 3).toString('hex').toUpperCase();
        for (const [sig, expectedMime] of this.FILE_SIGNATURES.entries()) {
            if (signature.startsWith(sig) || signature3.startsWith(sig)) {
                if (mimeType === expectedMime) {
                    return true;
                }
                if (sig === 'FFD8FF' && mimeType.startsWith('image/jpeg')) {
                    return true;
                }
                if (sig === '504B0304' && (mimeType.includes('excel') || mimeType.includes('zip'))) {
                    return true;
                }
            }
        }
        if (mimeType.includes('text') || mimeType.includes('csv')) {
            return true;
        }
        return false;
    }
    scanForMalwarePatterns(buffer) {
        const malwareSignatures = [];
        const content = buffer.toString('binary').toLowerCase();
        const dangerousPatterns = [
            /eval\s*\(/g,
            /document\.write/g,
            /<script[^>]*>/g,
            /javascript:/g,
            /vbscript:/g,
            /on\w+\s*=/g,
            /\\x[0-9a-f]{2}/g,
            /%[0-9a-f]{2}/g,
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(content)) {
                malwareSignatures.push(`Suspicious pattern: ${pattern.toString()}`);
            }
        }
        if (buffer.length > 2) {
            const header = buffer.subarray(0, 2).toString('hex').toUpperCase();
            if (header === '4D5A' || header === '7F45') {
                malwareSignatures.push('Executable file detected');
            }
        }
        return malwareSignatures;
    }
    async runVirusScan(buffer) {
        try {
            const clamscan = require('clamscan');
            const scanner = await new clamscan().init({
                removeInfected: false,
                quarantineInfected: false,
                scanLog: null,
                debugMode: false,
                fileList: null,
                scanRecursively: true,
                clamscan: {
                    path: '/usr/bin/clamscan',
                    scanArchives: true,
                    active: false
                },
                clamdscan: {
                    host: 'localhost',
                    port: 3310,
                    active: true
                }
            });
            const result = await scanner.scanBuffer(buffer, 3000, 1024 * 1024);
            return {
                infected: result.isInfected,
                viruses: result.viruses || []
            };
        }
        catch (error) {
            this.logger.warn(`ClamAV scan unavailable: ${error.message}`);
            const patterns = this.scanForMalwarePatterns(buffer);
            return {
                infected: patterns.length > 0,
                viruses: patterns
            };
        }
    }
    scanFileContent(buffer, filename) {
        const issues = [];
        if (buffer.length === 0) {
            issues.push('Empty file detected');
        }
        if (filename.toLowerCase().endsWith('.pdf')) {
            const pdfContent = buffer.toString('binary');
            if (pdfContent.includes('/JS') || pdfContent.includes('/JavaScript')) {
                issues.push('PDF contains JavaScript');
            }
            if (pdfContent.includes('/OpenAction') || pdfContent.includes('/AA')) {
                issues.push('PDF contains auto-actions');
            }
        }
        if (filename.toLowerCase().match(/\.(xlsx?|xls)$/)) {
            const excelContent = buffer.toString('binary');
            if (excelContent.includes('vbaProject') || excelContent.includes('macrosheet')) {
                issues.push('Excel file may contain macros');
            }
        }
        if (filename.toLowerCase().match(/\.(jpe?g|png|bmp|tiff?)$/)) {
            if (buffer.length > 10 * 1024 * 1024) {
                issues.push('Image file unusually large');
            }
        }
        return issues;
    }
    calculateFileHash(buffer, algorithm = 'sha256') {
        return crypto.createHash(algorithm).update(buffer).digest('hex');
    }
    async checkRateLimit(identifier, windowMs = 300000, maxRequests = 100) {
        const now = Date.now();
        const key = `ratelimit:${identifier}`;
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetTime: new Date(now + windowMs)
        };
    }
    generateSecureFilename(originalName) {
        const extension = originalName.split('.').pop()?.toLowerCase() || '';
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');
        return `evidence_${timestamp}_${random}${extension ? '.' + extension : ''}`;
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = SecurityService_1 = __decorate([
    (0, common_1.Injectable)()
], SecurityService);
//# sourceMappingURL=security.service.js.map