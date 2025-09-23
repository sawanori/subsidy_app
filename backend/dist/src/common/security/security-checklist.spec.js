"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const security_checklist_1 = require("./security-checklist");
describe('SecurityChecker', () => {
    let checker;
    beforeEach(() => {
        checker = new security_checklist_1.SecurityChecker();
    });
    it('should run all security checks', () => {
        const results = checker.runAllChecks();
        expect(results.length).toBeGreaterThan(0);
        expect(results.every(r => ['PASS', 'FAIL', 'PARTIAL', 'N/A'].includes(r.status))).toBe(true);
        expect(results.every(r => ['L1', 'L2', 'L3'].includes(r.level))).toBe(true);
    });
    it('should generate a security report', () => {
        checker.runAllChecks();
        const report = checker.generateReport();
        expect(report).toContain('OWASP ASVS/Lite Security Assessment');
        expect(report).toContain('Total Controls:');
        expect(report).toContain('PASS:');
        expect(report).toContain('Detailed Results');
    });
    it('should have mostly PASS status for implemented controls', () => {
        const results = checker.runAllChecks();
        const passed = results.filter(r => r.status === 'PASS').length;
        const total = results.length;
        expect(passed / total).toBeGreaterThan(0.8);
    });
    it('should include critical L1 controls', () => {
        const results = checker.runAllChecks();
        const l1Controls = results.filter(r => r.level === 'L1');
        const controlAreas = l1Controls.map(c => c.control.substring(0, 2));
        expect(controlAreas).toContain('V1');
        expect(controlAreas).toContain('V4');
        expect(controlAreas).toContain('V5');
        expect(controlAreas).toContain('V7');
        expect(controlAreas).toContain('V8');
    });
    it('should provide implementation details for PASS status', () => {
        const results = checker.runAllChecks();
        const passedControls = results.filter(r => r.status === 'PASS');
        expect(passedControls.every(c => c.implementation)).toBe(true);
    });
    it('should provide recommendations for PARTIAL/FAIL status', () => {
        const results = checker.runAllChecks();
        const partialOrFailed = results.filter(r => r.status === 'PARTIAL' || r.status === 'FAIL');
        partialOrFailed.forEach(control => {
            expect(control.recommendation).toBeDefined();
        });
    });
});
//# sourceMappingURL=security-checklist.spec.js.map