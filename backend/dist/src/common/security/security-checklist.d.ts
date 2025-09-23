export interface SecurityCheckResult {
    control: string;
    level: 'L1' | 'L2' | 'L3';
    status: 'PASS' | 'FAIL' | 'PARTIAL' | 'N/A';
    description: string;
    implementation?: string;
    recommendation?: string;
}
export declare class SecurityChecker {
    private results;
    addCheck(result: SecurityCheckResult): void;
    runAllChecks(): SecurityCheckResult[];
    private checkArchitecture;
    private checkAuthentication;
    private checkSessionManagement;
    private checkAccessControl;
    private checkValidation;
    private checkErrorHandling;
    private checkDataProtection;
    private checkMaliciousCode;
    generateReport(): string;
}
