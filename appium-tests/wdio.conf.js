const path = require('path');
const XLSX = require('xlsx');

let testResults = [];
let passed = 0;
let failed = 0;
let startTime;

exports.config = {
    runner: 'local',
    port: 4723,
    specs: [
        './tests/**/*.js'
    ],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator',
        'appium:automationName': 'UiAutomator2',
        // In CI or local, provide the path to the APK via env var
        'appium:app': process.env.APK_PATH || path.join(__dirname, '../frontend/android/app/build/outputs/apk/debug/app-debug.apk'),
        'appium:autoGrantPermissions': true
    }],
    logLevel: 'info',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    onPrepare: function (config, capabilities) {
        startTime = Date.now();
    },

    afterTest: function(test, context, { error, result, duration, passed: testPassed, retries }) {
        if (testPassed) {
            passed++;
            testResults.push({ TestName: test.title, Category: test.parent, PassFail: 'PASS', DurationMs: duration, Timestamp: new Date().toISOString() });
        } else {
            failed++;
            testResults.push({ TestName: test.title, Category: test.parent, PassFail: 'FAIL', Error: error?.message, DurationMs: duration, Timestamp: new Date().toISOString() });
        }
    },

    onComplete: function(exitCode, config, capabilities, results) {
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
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(testResults), 'Details');

        const outPath = path.join(__dirname, 'test-summary.xlsx');
        XLSX.writeFile(wb, outPath);
        console.log(`\nAppium Excel report generated at: ${outPath}`);
    }
}
