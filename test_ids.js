const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

const getElementByIds = [...appJs.matchAll(/\$\("([^"]+)"\)/g)].map(m => m[1]);
console.log("IDs accessed in app.js:");
const missing = [];
for (const id of new Set(getElementByIds)) {
  if (!html.includes(`id="${id}"`)) {
    missing.push(id);
  }
}
console.log("Missing IDs:", missing);
