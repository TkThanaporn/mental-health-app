const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('git diff --name-only --diff-filter=ACM', {
  encoding: 'utf8'
}).split(/\r?\n/).filter(Boolean);

let fixed = 0;

for (const file of files) {
  if (!/\.(js|jsx|json)$/.test(file) && file !== 'server/config/db.js') {
    continue;
  }
  if (!fs.existsSync(file)) continue;

  const original = fs.readFileSync(file, 'utf8');
  const cleaned = original.replace(/[ \t]+(?=\r?$)/gm, '');

  if (cleaned !== original) {
    fs.writeFileSync(file, cleaned, 'utf8');
    console.log('แก้ช่องว่าง:', file);
    fixed++;
  }
}

console.log(`ตรวจและแก้ไขแล้ว ${fixed} ไฟล์`);
