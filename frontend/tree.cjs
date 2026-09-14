const fs = require('fs');
const path = require('path');
 
const IGNORE = new Set(['node_modules', '.git', 'build', 'dist', '.next', '.cache', '.turbo']);
 
function printTree(dirPath, indent = '') {
  const items = fs.readdirSync(dirPath).filter(item => !IGNORE.has(item) && !item.startsWith('.'));
  items.sort();
 
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const fullPath = path.join(dirPath, item);
    const isLast = i === items.length - 1;
    const prefix = isLast ? '└── ' : '├── ';
    const nextIndent = indent + (isLast ? '    ' : '│   ');
 
    console.log(indent + prefix + item);
 
    if (fs.statSync(fullPath).isDirectory()) {
      printTree(fullPath, nextIndent);
    }
  }
}
 
// Start from current directory
console.log(`📁 React Project Structure: ${path.basename(process.cwd())}`);
printTree(process.cwd());
 