const mocha = require('mocha');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const { EVENT_RUN_END, EVENT_TEST_PASS, EVENT_TEST_FAIL, EVENT_TEST_END } = mocha.Runner.constants;

class ExcelReporter extends mocha.reporters.Base {
  constructor(runner) {
    super(runner);

    const testResults = [];
    const startTime = Date.now();
    let passed = 0;
    let failed = 0;

    runner.on(EVENT_TEST_PASS, (test) => {
      passed++;
      testResults.push({
        TestName: test.title,
        Category: test.parent.title,
        PassFail: 'PASS',
        DurationMs: test.duration,
        Timestamp: new Date().toISOString()
      });
    });

    runner.on(EVENT_TEST_FAIL, (test, err) => {
      failed++;
      testResults.push({
        TestName: test.title,
        Category: test.parent.title,
        PassFail: 'FAIL',
        Error: err.message,
        DurationMs: test.duration,
        Timestamp: new Date().toISOString()
      });
    });

    runner.on(EVENT_RUN_END, () => {
      const durationMs = Date.now() - startTime;
      const total = passed + failed;
      const passRate = total === 0 ? 0 : ((passed / total) * 100).toFixed(2);

      const summaryData = [
        { Metric: 'Total Tests', Value: total },
        { Metric: 'Passed', Value: passed },
        { Metric: 'Failed', Value: failed },
        { Metric: 'Pass Rate (%)', Value: passRate },
        { Metric: 'Duration (ms)', Value: durationMs }
      ];

      const wb = XLSX.utils.book_new();
      
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      const wsDetails = XLSX.utils.json_to_sheet(testResults);
      XLSX.utils.book_append_sheet(wb, wsDetails, 'Details');

      const outPath = path.join(__dirname, 'test-summary.xlsx');
      XLSX.writeFile(wb, outPath);
      console.log(`\nExcel report generated at: ${outPath}`);
    });
  }
}

module.exports = ExcelReporter;
