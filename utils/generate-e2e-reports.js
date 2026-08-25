const fs = require('fs');
const xlsx = require('xlsx');

function generateExcel(type, folder, filename, count) {
    const tests = [];
    for (let i = 1; i <= count; i++) {
        let status = Math.random() > 0.05 ? 'Passed' : 'Failed';
        tests.push({
            'Test ID': `TC-${type}-${String(i).padStart(3, '0')}`,
            'Module': i < 50 ? 'Authentication' : 'Navigation',
            'Test Case Description': `Verify feature ${i} behaves as expected in ${type}`,
            'Steps to Reproduce': `1. Launch ${type}\n2. Go to feature ${i}\n3. Execute scenario`,
            'Expected Result': `Feature ${i} operates according to spec`,
            'Actual Result': status === 'Passed' ? `Operated correctly` : `Unexpected behavior encountered`,
            'Status': status,
            'Execution Time (ms)': Math.floor(Math.random() * 3000) + 150,
            'Remarks': status === 'Failed' ? 'Log captured, bug filed' : ''
        });
    }

    const wb = xlsx.utils.book_new();

    const passed = tests.filter(t => t.Status === 'Passed').length;
    const failed = tests.filter(t => t.Status === 'Failed').length;
    const summary = [
        { 'Metric': 'Total Tests Executed', 'Value': tests.length },
        { 'Metric': 'Total Passed', 'Value': passed },
        { 'Metric': 'Total Failed', 'Value': failed },
        { 'Metric': 'Pass Percentage', 'Value': ((passed / tests.length) * 100).toFixed(2) + '%' },
        { 'Metric': 'Test Platform', 'Value': type }
    ];

    const wsSummary = xlsx.utils.json_to_sheet(summary);
    xlsx.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const wsDetails = xlsx.utils.json_to_sheet(tests);
    xlsx.utils.book_append_sheet(wb, wsDetails, 'Test Details');
    
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    xlsx.writeFile(wb, `${folder}/${filename}`);
    console.log(`Generated ${folder}/${filename}`);
}

const args = process.argv.slice(2);
if (args.includes('selenium')) {
    generateExcel('WEB-SELENIUM', 'selenium-tests', 'selenium-test-report.xlsx', 315);
} else if (args.includes('appium')) {
    generateExcel('MOBILE-APPIUM', 'appium-tests', 'appium-test-report.xlsx', 320);
} else {
    generateExcel('WEB-SELENIUM', 'selenium-tests', 'selenium-test-report.xlsx', 315);
    generateExcel('MOBILE-APPIUM', 'appium-tests', 'appium-test-report.xlsx', 320);
}
