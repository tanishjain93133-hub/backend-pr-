const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'uploads');
const dest = path.join(process.cwd(), '..', 'frontend', 'public', 'uploads');

console.log(`Copying uploads from ${src} to ${dest}...`);

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

fs.readdirSync(src).forEach(file => {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
});

console.log('✅ Copy completed successfully!');
