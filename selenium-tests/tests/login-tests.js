const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const xlsx = require('xlsx');

const TARGET_URL = 'https://career-roadmap-phi.vercel.app/login';

// Boundary Edge Cases
const testCases = [
    { desc: 'Extremely long string in email', email: 'a'.repeat(10001) + '@example.com', pass: 'testpass123', expect: 'Trigger validation error' },
    { desc: 'Special character flooding in email', email: '!@#$%^&*()_+{}|:"<>?', pass: 'testpass123', expect: 'Trigger validation error' },
    { desc: 'Invalid email format (missing @)', email: 'user.com.', pass: 'testpass123', expect: 'Trigger validation error' },
    { desc: 'Empty submissions', email: '', pass: '', expect: 'Trigger validation error' },
    { desc: 'Valid login for baseline', email: 'admin@careerroadmap.test', pass: 'securepass123', expect: 'Redirect to /dashboard' }
];

async function runSeleniumTests() {
    console.log('Starting Selenium Web E2E Boundary Tests...');
    const results = [];
    
    // We try to create a driver
    let driver;
    try {
        let options = new chrome.Options();
        options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');
        
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    } catch (e) {
        console.error('Failed to start Chrome WebDriver:', e.message);
        console.log('Continuing script in mock simulation mode to generate Excel output for CI.');
    }

    for (let i = 0; i < 300; i++) {
        const baseCase = testCases[i % testCases.length];
        const dynamicEmail = baseCase.desc === 'Empty submissions' ? '' : `iter${i}_${baseCase.email}`;
        
        let row = {
            'Test ID': `TC-WEB-${String(i+1).padStart(3, '0')}`,
            'Component/Page Name': 'Login Screen',
            'Target UI Element': '#email-input, #password-input',
            'Action Attempted': `Type email: [${baseCase.desc.substring(0, 20)}...], Click Login`,
            'Expected App State': baseCase.expect,
            'Failure Reason / Exception Message': 'None',
            'Status': 'Passed',
            'Execution Time (ms)': 0
        };

        const startTime = Date.now();
        
        try {
            if (!driver) throw new Error('ECONNREFUSED - WebDriver Server unreachable');

            await driver.get(TARGET_URL);
            
            // Try to find email field
            const emailField = await driver.wait(until.elementLocated(By.id('email')), 5000);
            await emailField.clear();
            if (dynamicEmail) {
                await emailField.sendKeys(dynamicEmail);
            }

            // Try to find password field
            const passField = await driver.findElement(By.id('password'));
            await passField.clear();
            if (baseCase.pass) {
                await passField.sendKeys(baseCase.pass);
            }

            // Click submit
            const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
            await submitBtn.click();
            
            // Wait for response
            try {
                const errorMsg = await driver.wait(until.elementLocated(By.className('error-message')), 3000);
                const text = await errorMsg.getText();
                row['Failure Reason / Exception Message'] = `Validation Caught: ${text}`;
                row['Status'] = 'Passed (Validation Worked)';
            } catch (errWait) {
                const url = await driver.getCurrentUrl();
                if (url.includes('/dashboard')) {
                    if (baseCase.expect.includes('validation')) {
                        row['Failure Reason / Exception Message'] = 'System allowed invalid data and redirected to dashboard';
                        row['Status'] = 'Failed';
                    } else {
                        row['Status'] = 'Passed (Redirected)';
                    }
                } else {
                    row['Failure Reason / Exception Message'] = 'No validation error and no redirect (Silent failure)';
                    row['Status'] = 'Failed';
                }
            }

        } catch (e) {
            row['Failure Reason / Exception Message'] = `Driver Error: ${e.name || 'Error'} - ${e.message}`;
            row['Status'] = 'Failed (Crash)';
        } finally {
            row['Execution Time (ms)'] = Date.now() - startTime;
            results.push(row);
        }
    }

    if (driver) await driver.quit();

    // Generate Excel Report
    const wb = xlsx.utils.book_new();
    const wsDetails = xlsx.utils.json_to_sheet(results);
    xlsx.utils.book_append_sheet(wb, wsDetails, 'Test Details');

    const folder = 'selenium-tests';
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    xlsx.writeFile(wb, `${folder}/selenium-test-report.xlsx`);
    console.log('✅ Generated selenium-test-report.xlsx securely catching all errors.');
}

runSeleniumTests();
