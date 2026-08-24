const { remote } = require('webdriverio');

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

describe('App Login E2E Tests', function() {
    let client;

    before(async function() {
        client = await remote(wdOpts);
    });

    after(async function() {
        if (client) {
            await client.deleteSession();
        }
    });

    it('should display login screen on app launch', async function() {
        const emailField = await client.$('~email-input');
        await emailField.waitForDisplayed({ timeout: 5000 });
    });

    it('should show error for invalid login', async function() {
        const emailField = await client.$('~email-input');
        await emailField.setValue('invalid@example.com');
        
        const passwordField = await client.$('~password-input');
        await passwordField.setValue('wrongpass');
        
        const loginBtn = await client.$('~login-button');
        await loginBtn.click();
        
        const errorMsg = await client.$('~error-message');
        await errorMsg.waitForDisplayed({ timeout: 5000 });
    });

    it('should navigate to home on successful login', async function() {
        const emailField = await client.$('~email-input');
        await emailField.setValue('user@example.com');
        
        const passwordField = await client.$('~password-input');
        await passwordField.setValue('correctpass');
        
        const loginBtn = await client.$('~login-button');
        await loginBtn.click();
        
        const homeScreen = await client.$('~home-screen');
        await homeScreen.waitForDisplayed({ timeout: 5000 });
    });
});
