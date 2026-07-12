const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../../client/src');
const oldUrl = 'http://localhost:3000';
const newUrl = 'http://localhost:3000';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

console.log(`Starting URL replacement in: ${targetDir}`);
let modifiedCount = 0;

walkDir(targetDir, (filePath) => {
  const ext = path.extname(filePath);
  if (['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css'].includes(ext)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(oldUrl)) {
        const updatedContent = content.split(oldUrl).join(newUrl);
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Modified: ${filePath}`);
        modifiedCount++;
      }
    } catch (err) {
      console.error(`Error processing file ${filePath}:`, err);
    }
  }
});

console.log(`Replacement complete. Modified ${modifiedCount} files.`);
