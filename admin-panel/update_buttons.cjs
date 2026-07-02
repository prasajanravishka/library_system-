const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('d:/Projects/Smart-Library-Management-System/admin-panel/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<button') && !content.includes('active:scale-[0.97]')) {
    // Replace className="..." inside <button ... >
    content = content.replace(/<button([^>]*)className=["']([^"']+)["']/g, (match, p1, p2) => {
      if (!p2.includes('active:scale-')) {
         return `<button${p1}className="${p2} active:scale-[0.97]"`;
      }
      return match;
    });
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
