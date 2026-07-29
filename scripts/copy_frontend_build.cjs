const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
const dest = path.resolve(__dirname, '..', 'dist');

console.log(`Copying compiled frontend build from ${src} to ${dest}...`);

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.mkdirSync(dest, { recursive: true });

const copyRecursiveSync = (srcDir, destDir) => {
  fs.readdirSync(srcDir).forEach(file => {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    const stat = fs.statSync(srcFile);
    if (stat.isDirectory()) {
      fs.mkdirSync(destFile, { recursive: true });
      copyRecursiveSync(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
};

if (fs.existsSync(src)) {
  copyRecursiveSync(src, dest);
  console.log('✅ Frontend build copy completed successfully!');
} else {
  console.error('❌ Source frontend build folder not found. Please run "npm run build" first.');
  process.exit(1);
}
