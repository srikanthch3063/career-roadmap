const x = require('xlsx');
const fs = require('fs');
const wb = x.readFile('selenium-tests/selenium-test-report.xlsx');
const sum = x.utils.sheet_to_json(wb.Sheets.Summary);
const det = x.utils.sheet_to_json(wb.Sheets['Test Details']);
let md = '### Summary\n| Metric | Value | Log |\n|---|---|---|\n';
sum.forEach(r => { md += `| ${r.Metric} | ${r.Value} | ${r.Log} |\n`; });
md += '\n### Test Cases (first 20 of 300 with name & log)\n| Test ID | Module | Test Case Description | Status | Tester | Log ID |\n|---|---|---|---|---|---|\n';
det.slice(0,20).forEach(r => {
  const desc = String(r['Test Case Description'] || '').substring(0,45).replace(/\|/g,'/');
  md += `| ${r['Test ID']} | ${r.Module} | ${desc} | ${r.Status} | ${r.Tester} | ${r['Log ID']} |\n`;
});
md += `\n_... + ${det.length-20} more cases in Excel artifact (all 300 with name & log). Full file: selenium-tests/selenium-test-report.xlsx_\n`;
fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
det.forEach(r => {
  const desc = String(r['Test Case Description'] || '').substring(0,50).replace(/\|/g,'/');
  console.log(`::notice title=${r['Test ID']}::${r.Module} - ${desc} | ${r.Status} | Log ${r['Log ID']}`);
});
console.log('Published summary with', det.length, 'cases');
