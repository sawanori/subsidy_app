#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const security_checklist_1 = require("../common/security/security-checklist");
async function runSecurityAssessment() {
    console.log('🔒 Running OWASP ASVS/Lite Security Assessment...\n');
    const checker = new security_checklist_1.SecurityChecker();
    const results = checker.runAllChecks();
    const report = checker.generateReport();
    console.log(report);
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;
    const passRate = passed / total;
    if (passRate >= 0.8 && failed === 0) {
        console.log('✅ Security Assessment: PASS');
        console.log(`Pass rate: ${Math.round(passRate * 100)}%`);
        process.exit(0);
    }
    else {
        console.log('❌ Security Assessment: FAIL');
        console.log(`Pass rate: ${Math.round(passRate * 100)}% (minimum required: 80%)`);
        console.log(`Failed controls: ${failed}`);
        process.exit(1);
    }
}
runSecurityAssessment().catch(console.error);
//# sourceMappingURL=security-check.js.map