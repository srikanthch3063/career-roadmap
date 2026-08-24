const autocannon = require('autocannon');
const ExcelJS = require('exceljs');
const path = require('path');

const url = 'http://localhost:3000/'; // Target backend URL. Adjust if you have a specific /api/health endpoint.

console.log(`Starting load test against ${url}`);
console.log('Connections: 100');
console.log('Duration: 60 seconds');

const instance = autocannon({
    url: url,
    connections: 100,
    duration: 60,
}, async (err, result) => {
    if (err) {
        console.error('Error running autocannon:', err);
        return;
    }

    console.log('\nLoad test completed. Generating Excel report...');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Load Test Summary');

    sheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
    ];

    sheet.getRow(1).font = { bold: true };

    // Extract exactly the metrics requested, plus some useful extras
    sheet.addRows([
        { metric: 'Requests per second (RPS)', value: result.requests.average },
        { metric: 'Response Time Average (ms)', value: result.latency.average },
        { metric: 'Response Time Min (ms)', value: result.latency.min },
        { metric: 'Response Time Max (ms)', value: result.latency.max },
        { metric: 'Target URL', value: result.url },
        { metric: 'Total Connections', value: result.connections },
        { metric: 'Duration (seconds)', value: result.duration }
    ]);

    const reportPath = path.join(__dirname, '..', 'Load-Performance-Report.xlsx');
    
    try {
        await workbook.xlsx.writeFile(reportPath);
        console.log(`Successfully generated ${reportPath}`);
    } catch (writeErr) {
        console.error('Failed to write Excel file:', writeErr);
    }
});

// This will display a live progress bar in the terminal while the test runs
autocannon.track(instance, { renderProgressBar: true });
