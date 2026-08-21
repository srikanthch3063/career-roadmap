const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');

const branches = [
  "Computer Science & Engineering (CSE)",
  "Mechanical Engineering",
  "Civil Engineering",
  "Other"
];

const freeTextEdgeCases = [
  { name: 'Empty Free Text', input: '' },
  { name: 'Very Long Text', input: 'a'.repeat(2000) },
  { name: 'Special Characters', input: '<script>alert(1)</script>; DROP TABLE;' }
];

const BASE_URL = process.env.LIVE_URL || 'http://localhost:5173';

describe('Quiz & Roadmap Flows', function () {
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
    // Pre-requisite: Need to be logged in to take quiz.
    // For these tests, we assume a test user exists and we log them in.
    await driver.get(`${BASE_URL}/auth`);
    await driver.findElement(By.css('input[type="email"]')).sendKeys('student@careerroadmap.test');
    await driver.findElement(By.css('input[type="password"]')).sendKeys('SecurePass123!');
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('dashboard'), 5000);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  describe('Parameterized Branch Selection', function () {
    for (const branch of branches) {
      it(`Should complete quiz flow for branch: ${branch}`, async function () {
        await driver.get(`${BASE_URL}/quiz`);
        
        // Select branch
        const radio = await driver.findElement(By.xpath(`//input[@value="${branch}"]`));
        await driver.executeScript("arguments[0].click();", radio);
        
        if (branch === 'Other') {
          await driver.findElement(By.css('input[placeholder="Please specify your branch"]')).sendKeys('Custom Branch');
        }
        
        await driver.findElement(By.xpath("//button[text()='Next']")).click();

        // Just select first option for all 6 questions to proceed quickly
        for(let i=0; i<6; i++) {
          const firstOption = await driver.findElement(By.css('.hidden-radio'));
          await driver.executeScript("arguments[0].click();", firstOption);
          await driver.findElement(By.xpath("//button[text()='Next']")).click();
        }

        // Free text step
        await driver.findElement(By.css('textarea')).sendKeys('Standard response');
        
        const submitBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Generate Roadmap')]"));
        await submitBtn.click();

        // Should land on results
        await driver.wait(until.urlContains('/results'), 15000); // Roadmap generation takes time
        const header = await driver.wait(until.elementLocated(By.css('h1')), 5000);
        expect(await header.getText()).to.equal('Your Career Roadmap');
      });
    }
  });

  describe('Free Text Edge Cases', function () {
    for (const edge of freeTextEdgeCases) {
      it(`Should handle free text: ${edge.name}`, async function () {
        await driver.get(`${BASE_URL}/quiz`);
        
        // Step 0: Branch
        const radio = await driver.findElement(By.xpath(`//input[@value="Computer Science & Engineering (CSE)"]`));
        await driver.executeScript("arguments[0].click();", radio);
        await driver.findElement(By.xpath("//button[text()='Next']")).click();

        // Skip to free text (6 questions)
        for(let i=0; i<6; i++) {
          const firstOption = await driver.findElement(By.css('.hidden-radio'));
          await driver.executeScript("arguments[0].click();", firstOption);
          await driver.findElement(By.xpath("//button[text()='Next']")).click();
        }

        // Fill edge case free text
        await driver.findElement(By.css('textarea')).sendKeys(edge.input);
        
        const submitBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Generate Roadmap')]"));
        await submitBtn.click();

        await driver.wait(until.urlContains('/results'), 15000);
        const header = await driver.wait(until.elementLocated(By.css('h1')), 5000);
        expect(await header.getText()).to.equal('Your Career Roadmap');
      });
    }
  });
});
