const { remote } = require('webdriverio');
const fs = require('fs');
const xlsx = require('xlsx');

const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:app': '/path/to/app.apk',
    'appium:appActivity': '.MainActivity'
};

const wdOpts = {
    hostname: '127.0.0.1',
    port: 4723,
    logLevel: 'error',
    capabilities,
};

// Boundary Edge Cases
const testCases = [
    { desc: 'Extremely long string in email', email: 'a'.repeat(10001) + '@example.com', pass: 'testpass123', expect: 'Trigger validation error' },
    { desc: 'Special character flooding in email', email: '!@#$%^&*()_+{}|:"<>?', pass: 'testpass123', expect: 'Trigger validation error' },
    { desc: 'Invalid email format (missing @)', email: 'user.com.', pass: 'testpass123', expect: 'Trigger validation error' },
    { desc: 'Empty submissions', email: '', pass: '', expect: 'Trigger validation error' },
    { desc: 'Valid login for baseline', email: 'admin@careerroadmap.test', pass: 'securepass123', expect: 'Navigate to Home' }
];

async function runAppiumTests() {
    console.log('Starting Appium Mobile E2E Boundary Tests...');
    const results = [];
    
    let client;
    try {
        client = await remote(wdOpts);
    } catch (e) {
        console.error('Failed to connect to Appium Server:', e.message);
        console.log('Continuing script in mock simulation mode to generate Excel output for CI.');
    }

    for (let i = 0; i < 300; i++) {
        const baseCase = testCases[i % testCases.length];
        const dynamicEmail = baseCase.desc === 'Empty submissions' ? '' : `iter${i}_${baseCase.email}`;
        
        let row = {
            'Test ID': `TC-APP-${String(i+1).padStart(3, '0')}`,
            'Component/Page Name': 'Mobile Login Screen',
            'Target UI Element': '~email-input, ~password-input, ~login-button',
            'Action Attempted': `Type email: [${baseCase.desc.substring(0, 20)}...], Click Login`,
            'Expected App State': baseCase.expect,
            'Failure Reason / Exception Message': 'None',
            'Status': 'Passed',
            'Execution Time (ms)': 0
        };

        const startTime = Date.now();
        
        try {
            if (!client) {
                // Simulate an execution failure if appium is down
                throw new Error('ECONNREFUSED - Appium Server unreachable');
            }

            const emailField = await client.$('~email-input');
            await emailField.waitForDisplayed({ timeout: 5000 });
            await emailField.setValue(dynamicEmail);

            const passwordField = await client.$('~password-input');
            await passwordField.setValue(baseCase.pass);

            const loginBtn = await client.$('~login-button');
            await loginBtn.click();
            
            try {
                const errorMsg = await client.$('~error-message');
                await errorMsg.waitForDisplayed({ timeout: 3000 });
                const text = await errorMsg.getText();
                row['Failure Reason / Exception Message'] = `Validation Caught: ${text}`;
                row['Status'] = 'Passed (Validation Worked)';
            } catch (errWait) {
                const homeScreen = await client.$('~home-screen');
                const isHome = await homeScreen.isDisplayed();
                
                if (isHome) {
                    if (baseCase.expect.includes('validation')) {
                        row['Failure Reason / Exception Message'] = 'System allowed invalid data and navigated to home';
                        row['Status'] = 'Failed';
                    } else {
                        row['Status'] = 'Passed (Navigated)';
                    }
                } else {
                    row['Failure Reason / Exception Message'] = 'No validation error and no navigation (Silent failure)';
                    row['Status'] = 'Failed';
                }
            }
        } catch (e) {
            row['Failure Reason / Exception Message'] = `Appium Error: ${e.name || 'Error'} - ${e.message}`;
            row['Status'] = 'Failed (Crash)';
        } finally {
            row['Execution Time (ms)'] = Date.now() - startTime;
            results.push(row);
        }
    }

    if (client) {
        await client.deleteSession();
    }

    // Generate Excel Report
    const wb = xlsx.utils.book_new();
    const wsDetails = xlsx.utils.json_to_sheet(results);
    xlsx.utils.book_append_sheet(wb, wsDetails, 'Test Details');

    const folder = 'appium-tests';
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    xlsx.writeFile(wb, `${folder}/appium-test-report.xlsx`);
    console.log('✅ Generated appium-test-report.xlsx securely catching all errors.');
}

runAppiumTests();
