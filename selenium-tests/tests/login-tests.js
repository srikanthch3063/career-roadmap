const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');

describe('Pathforge Web E2E - Login & Core Functionality', function () {
  this.timeout(30000);
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async function () {
    await driver.quit();
  });

  it('1. Should load the landing page successfully', async function () {
    await driver.get('http://localhost:5173/'); // or Vercel URL
    const title = await driver.getTitle();
    assert.match(title, /Pathforge/);
  });

  it('2. Should fail login with invalid credentials', async function () {
    await driver.get('http://localhost:5173/auth');
    await driver.wait(until.elementLocated(By.css('input[type="email"]')), 5000);
    
    await driver.findElement(By.css('input[type="email"]')).sendKeys('invalid@example.com');
    await driver.findElement(By.css('input[type="password"]')).sendKeys('wrongpass');
    await driver.findElement(By.css('button[type="submit"]')).click();

    const toast = await driver.wait(until.elementLocated(By.css('.sonner-toast')), 5000);
    const errorText = await toast.getText();
    assert.ok(errorText.toLowerCase().includes('invalid') || errorText.toLowerCase().includes('error'));
  });

  it('3. Should open the mobile hamburger menu when clicked on narrow viewports', async function () {
    // Resize to mobile
    await driver.manage().window().setRect({ width: 375, height: 812 });
    
    // Attempt to click the hamburger menu we fixed earlier
    const hamburger = await driver.wait(until.elementLocated(By.css('.mobile-menu-toggle')), 5000);
    await hamburger.click();

    // Verify sidebar gets the mobile-open class
    const sidebar = await driver.findElement(By.css('.lumen-sidebar'));
    const classes = await sidebar.getAttribute('class');
    assert.ok(classes.includes('mobile-open'));
  });
});
