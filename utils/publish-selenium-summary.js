const x = require('xlsx');
const fs = require('fs');
const wb = x.readFile('selenium-tests/selenium-test-report.xlsx');
const sum = x.utils.sheet_to_json(wb.Sheets.Summary, { defval: '' });
const det = x.utils.sheet_to_json(wb.Sheets['Test Details'], { defval: '' });
console.log('DEBUG Summary keys', Object.keys(sum[0]||{}));
console.log('DEBUG Details keys', Object.keys(det[0]||{}));
console.log('DEBUG first detail', det[0]);
let md = '### Summary\n| Metric | Value | Log |\n|---|---|---|\n';
sum.forEach(r => {
  const metric = r['Metric'] ?? r['metric'] ?? '';
  const value = r['Value'] ?? r['value'] ?? '';
  const log = r['Log'] ?? r['log'] ?? '';
  md += `| ${metric} | ${value} | ${log} |\n`;
});
md += '\n### Test Cases (first 20 of 300 with name & log)\n| Test ID | Module | Test Case Description | Status | Tester | Log ID |\n|---|---|---|---|---|---|\n';
det.slice(0,20).forEach(r => {
  const tid = r['Test ID'] ?? r['TestId'] ?? '';
  const mod = r['Module'] ?? r['module'] ?? '';
  const desc = String(r['Test Case Description'] ?? r['Description'] ?? '').substring(0,45).replace(/\|/g,'/');
  const status = r['Status'] ?? r['status'] ?? '';
  const tester = r['Tester'] ?? r['tester'] ?? '';
  const logid = r['Log ID'] ?? r['LogId'] ?? r['log'] ?? '';
  md += `| ${tid} | ${mod} | ${desc} | ${status} | ${tester} | ${logid} |\n`;
});
md += `\n_... + ${det.length-20} more cases in Excel artifact (all 300 with name & log). Full file: selenium-tests/selenium-test-report.xlsx_\n`;
fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
det.slice(0,10).forEach(r => {
  const tid = r['Test ID'] ?? '';
  const mod = r['Module'] ?? '';
  const desc = String(r['Test Case Description'] ?? '').substring(0,50).replace(/\|/g,'/');
  const status = r['Status'] ?? '';
  const logid = r['Log ID'] ?? '';
  console.log(`::notice title=${tid}::${mod} - ${desc} | ${status} | Log ${logid}`);
});
console.log('Published summary with', det.length, 'cases');
