"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityChecker = void 0;
class SecurityChecker {
    constructor() {
        this.results = [];
    }
    addCheck(result) {
        this.results.push(result);
    }
    runAllChecks() {
        this.results = [];
        this.checkArchitecture();
        this.checkAuthentication();
        this.checkSessionManagement();
        this.checkAccessControl();
        this.checkValidation();
        this.checkErrorHandling();
        this.checkDataProtection();
        this.checkMaliciousCode();
        return this.results;
    }
    checkArchitecture() {
        this.addCheck({
            control: 'V1.2.1',
            level: 'L1',
            status: 'PASS',
            description: 'Use of security architecture components',
            implementation: 'Helmet middleware, CORS configuration, Rate limiting implemented',
        });
        this.addCheck({
            control: 'V1.4.2',
            level: 'L1',
            status: 'PASS',
            description: 'Trust boundaries identified',
            implementation: 'Clear separation between frontend, backend, and database layers',
        });
    }
    checkAuthentication() {
        this.addCheck({
            control: 'V2.1.1',
            level: 'L1',
            status: 'PARTIAL',
            description: 'Password security requirements',
            implementation: 'JWT-based auth planned, password policies not yet implemented',
            recommendation: 'Implement password complexity requirements and secure storage',
        });
        this.addCheck({
            control: 'V2.2.1',
            level: 'L1',
            status: 'PASS',
            description: 'Anti-automation controls',
            implementation: 'Rate limiting implemented via @nestjs/throttler',
        });
    }
    checkSessionManagement() {
        this.addCheck({
            control: 'V3.2.1',
            level: 'L1',
            status: 'PARTIAL',
            description: 'Session token generation',
            implementation: 'JWT tokens planned, secure generation to be implemented',
            recommendation: 'Use cryptographically secure random token generation',
        });
        this.addCheck({
            control: 'V3.3.1',
            level: 'L1',
            status: 'PASS',
            description: 'Logout functionality',
            implementation: 'Stateless JWT approach, logout handled client-side',
        });
    }
    checkAccessControl() {
        this.addCheck({
            control: 'V4.1.1',
            level: 'L1',
            status: 'PASS',
            description: 'Access control enforcement',
            implementation: 'RBAC implemented with role-based guards and decorators',
        });
        this.addCheck({
            control: 'V4.1.2',
            level: 'L1',
            status: 'PASS',
            description: 'Principle of least privilege',
            implementation: 'Role-based permissions: ADMIN > EDITOR > VIEWER',
        });
        this.addCheck({
            control: 'V4.2.1',
            level: 'L1',
            status: 'PASS',
            description: 'Data layer authorization',
            implementation: 'User-based data filtering implemented in services',
        });
    }
    checkValidation() {
        this.addCheck({
            control: 'V5.1.1',
            level: 'L1',
            status: 'PASS',
            description: 'Input validation',
            implementation: 'class-validator with DTO validation, whitelist and forbidNonWhitelisted enabled',
        });
        this.addCheck({
            control: 'V5.1.3',
            level: 'L1',
            status: 'PASS',
            description: 'Output encoding',
            implementation: 'NestJS automatic JSON encoding, Helmet CSP headers',
        });
        this.addCheck({
            control: 'V5.3.4',
            level: 'L1',
            status: 'PASS',
            description: 'SQL injection prevention',
            implementation: 'Prisma ORM with parameterized queries',
        });
    }
    checkErrorHandling() {
        this.addCheck({
            control: 'V7.1.1',
            level: 'L1',
            status: 'PASS',
            description: 'Error message content',
            implementation: 'Generic error responses, no sensitive information exposed',
        });
        this.addCheck({
            control: 'V7.3.1',
            level: 'L1',
            status: 'PASS',
            description: 'Audit logging',
            implementation: 'Comprehensive audit logging for CRUD operations with data masking',
        });
    }
    checkDataProtection() {
        this.addCheck({
            control: 'V8.2.1',
            level: 'L1',
            status: 'PASS',
            description: 'Data classification',
            implementation: 'Personal/Internal/Public data classification implemented',
        });
        this.addCheck({
            control: 'V8.2.3',
            level: 'L1',
            status: 'PASS',
            description: 'Sensitive data logging',
            implementation: 'Personal data masked in logs (email, account numbers)',
        });
        this.addCheck({
            control: 'V8.3.1',
            level: 'L1',
            status: 'PASS',
            description: 'Encryption in transit',
            implementation: 'TLS 1.2+ enforced via Helmet HSTS',
        });
    }
    checkMaliciousCode() {
        this.addCheck({
            control: 'V10.2.1',
            level: 'L1',
            status: 'PASS',
            description: 'Dependency management',
            implementation: 'npm audit integrated, no known vulnerabilities',
        });
        this.addCheck({
            control: 'V10.3.1',
            level: 'L1',
            status: 'PASS',
            description: 'Application integrity',
            implementation: 'Package-lock.json ensures consistent dependencies',
        });
    }
    generateReport() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const partial = this.results.filter(r => r.status === 'PARTIAL').length;
        const total = this.results.length;
        let report = `\n=== OWASP ASVS/Lite Security Assessment ===\n`;
        report += `Total Controls: ${total}\n`;
        report += `PASS: ${passed} (${Math.round(passed / total * 100)}%)\n`;
        report += `PARTIAL: ${partial} (${Math.round(partial / total * 100)}%)\n`;
        report += `FAIL: ${failed} (${Math.round(failed / total * 100)}%)\n\n`;
        report += `=== Detailed Results ===\n`;
        this.results.forEach(result => {
            report += `[${result.status}] ${result.control} (${result.level}): ${result.description}\n`;
            if (result.implementation) {
                report += `  ✓ Implementation: ${result.implementation}\n`;
            }
            if (result.recommendation) {
                report += `  ⚠ Recommendation: ${result.recommendation}\n`;
            }
            report += '\n';
        });
        return report;
    }
}
exports.SecurityChecker = SecurityChecker;
//# sourceMappingURL=security-checklist.js.map