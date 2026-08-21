const XLSX = require('xlsx');
const path = require('path');

const outDir = path.join(__dirname, '../Vulnerability Test Results');

// 1. Endpoint Inventory
const endpoints = [
  { Endpoint: '/api/generate-roadmap', Method: 'POST', AuthRequired: 'Yes', ExpectedRole: 'Student/Admin', FilePath: 'backend/src/routes/roadmap.ts' },
  { Endpoint: '/api/admin/stats', Method: 'GET', AuthRequired: 'Yes', ExpectedRole: 'Admin', FilePath: 'backend/src/routes/admin.ts' },
  { Endpoint: '/health', Method: 'GET', AuthRequired: 'No', ExpectedRole: 'Any', FilePath: 'backend/src/index.ts' }
];

const wbInventory = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbInventory, XLSX.utils.json_to_sheet(endpoints), 'Endpoints');
XLSX.writeFile(wbInventory, path.join(outDir, 'endpoint-inventory.xlsx'));

// 2. Findings
const findings = [
  { ID: 'VULN-01', Severity: 'Moderate', Component: '@capacitor/cli', Description: 'Transitive uuid missing buffer bounds check', Remediation: 'Update @capacitor/cli' },
  { ID: 'VULN-02', Severity: 'Low', Component: 'Groq API', Description: 'Potential rate limit exhaustion despite express-rate-limit', Remediation: 'Implement CAPTCHA' }
];

const riskSummary = [
  { Severity: 'Critical', Count: 0 },
  { Severity: 'High', Count: 0 },
  { Severity: 'Moderate', Count: 3 }, // 3 from npm audit
  { Severity: 'Low', Count: 1 }
];

const wbFindings = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbFindings, XLSX.utils.json_to_sheet(findings), 'Findings');
XLSX.utils.book_append_sheet(wbFindings, XLSX.utils.json_to_sheet(endpoints), 'Endpoints');
XLSX.utils.book_append_sheet(wbFindings, XLSX.utils.json_to_sheet([{ Package: '@capacitor/cli', Vuln: 'uuid bounds check' }]), 'Dependency Vulns');
XLSX.utils.book_append_sheet(wbFindings, XLSX.utils.json_to_sheet(riskSummary), 'Risk Summary');

XLSX.writeFile(wbFindings, path.join(outDir, 'findings.xlsx'));

console.log('Excel reports generated successfully.');
