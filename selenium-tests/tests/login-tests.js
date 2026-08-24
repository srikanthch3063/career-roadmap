const { Builder, By, until } = require('selenium-webdriver');

describe('Frontend Login E2E Tests', function() {
    let driver;

    before(async function() {
        driver = await new Builder().forBrowser('chrome').build();
    });

    after(async function() {
        if (driver) {
            await driver.quit();
        }
    });

    it('should load the login page', async function() {
        await driver.get('http://localhost:5173/login');
        let title = await driver.getTitle();
        if (!title.includes('Pathforge')) {
            throw new Error('Title does not match');
        }
    });

    it('should show error on invalid credentials', async function() {
        await driver.get('http://localhost:5173/login');
        await driver.findElement(By.id('email')).sendKeys('invalid@example.com');
        await driver.findElement(By.id('password')).sendKeys('wrongpassword');
        await driver.findElement(By.css('button[type="submit"]')).click();
        
        let errorMsg = await driver.wait(until.elementLocated(By.className('error-message')), 5000);
        let text = await errorMsg.getText();
        if (!text) throw new Error('Error message not displayed');
    });

    it('should login successfully with valid credentials', async function() {
        await driver.get('http://localhost:5173/login');
        await driver.findElement(By.id('email')).sendKeys('test@example.com');
        await driver.findElement(By.id('password')).sendKeys('correctpassword');
        await driver.findElement(By.css('button[type="submit"]')).click();
        
        await driver.wait(until.urlContains('/dashboard'), 5000);
    });
});
