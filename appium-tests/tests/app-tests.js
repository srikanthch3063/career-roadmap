const { expect } = require('chai');

const loginScenarios = [
  { name: 'Valid Login', email: 'admin@careerroadmap.test', pass: 'SecurePass123!', expected: 'success' },
  { name: 'Invalid Password', email: 'admin@careerroadmap.test', pass: 'WrongPass!', expected: 'error' }
];

describe('Android APK Mobile Tests', () => {
    
    describe('Mobile Authentication', () => {
        for (const scenario of loginScenarios) {
            it(`Should handle Mobile: ${scenario.name}`, async () => {
                // Assuming Capacitor renders webviews, context switching might be needed, 
                // but UiAutomator2 can often find webview elements natively if they are accessible.
                
                // Wait for auth screen
                const emailInput = await $('//android.widget.EditText[@resource-id="email-input" or @text="Email"]');
                await emailInput.waitForExist({ timeout: 10000 });
                
                await emailInput.setValue(scenario.email);
                
                const passInput = await $('//android.widget.EditText[@resource-id="password-input" or @text="Password"]');
                await passInput.setValue(scenario.pass);
                
                const loginBtn = await $('//android.widget.Button[contains(@text, "Log In")]');
                await loginBtn.click();
                
                if (scenario.expected === 'error') {
                    // Mobile specific error alert check
                    const alert = await $('//*[contains(@text, "Invalid login credentials")]');
                    await alert.waitForExist({ timeout: 5000 });
                    expect(await alert.isExisting()).to.be.true;
                } else {
                    // Wait for dashboard
                    const dashboard = await $('//*[contains(@text, "Dashboard")]');
                    await dashboard.waitForExist({ timeout: 10000 });
                    expect(await dashboard.isExisting()).to.be.true;
                }
            });
        }
    });

    describe('Mobile-Specific Capabilities', () => {
        it('Should retain quiz state after app backgrounding and resuming', async () => {
            // Assume we are on Quiz page
            const branchRadio = await $('//*[contains(@text, "Computer Science & Engineering")]');
            await branchRadio.click();

            // Background app for 3 seconds
            await driver.background(3);
            
            // Resume
            // Verify selection is still there
            const isChecked = await branchRadio.getAttribute('checked');
            expect(isChecked).to.equal('true');
        });

        it('Should handle screen rotation without data loss', async () => {
            await driver.setOrientation('LANDSCAPE');
            const branchRadio = await $('//*[contains(@text, "Computer Science & Engineering")]');
            const isChecked = await branchRadio.getAttribute('checked');
            expect(isChecked).to.equal('true');
            
            await driver.setOrientation('PORTRAIT');
        });

        it('Should handle native back button appropriately', async () => {
            // Navigate forward
            const nextBtn = await $('//android.widget.Button[@text="Next"]');
            await nextBtn.click();

            // Native android back button
            await driver.back();

            // Verify we returned to the branch selection step
            const branchRadio = await $('//*[contains(@text, "Computer Science & Engineering")]');
            await branchRadio.waitForExist({ timeout: 5000 });
            expect(await branchRadio.isDisplayed()).to.be.true;
        });
    });
});
