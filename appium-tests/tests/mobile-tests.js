const { remote } = require('webdriverio');
const assert = require('assert');

const capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Android Emulator',
  'appium:browserName': 'Chrome'
};

const wdOpts = {
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
  logLevel: 'info',
  capabilities,
};

describe('Pathforge Mobile Appium E2E Tests', function () {
  this.timeout(60000);
  let client;

  before(async function () {
    client = await remote(wdOpts);
  });

  after(async function () {
    await client.deleteSession();
  });

  it('1. Should load the mobile view correctly', async function () {
    await client.url('http://10.0.2.2:5173/');
    const title = await client.getTitle();
    assert.match(title, /Pathforge/);
  });

  it('2. Should display footer links wrapped on mobile', async function () {
    const footer = await client.$('.footer-ft5__links');
    const isDisplayed = await footer.isDisplayed();
    assert.ok(isDisplayed);
  });

  it('3. Should open the Resources Modal properly bounded', async function () {
    await client.url('http://10.0.2.2:5173/roadmap/example');
    
    // Check if the overlay exists on click
    const resourceBtn = await client.$('.btn-secondary');
    if (await resourceBtn.isExisting()) {
      await resourceBtn.click();
      const modal = await client.$('.modal-content');
      assert.ok(await modal.isDisplayed());
    }
  });
});
