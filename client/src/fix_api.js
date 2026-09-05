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
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('.');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let orig = content;

  content = content.replace(/window\.API_BASE\s*\|\|\s*\(\s*window\.location\.hostname\s*===\s*["'`]localhost["'`]\s*\?\s*["'`]http:\/\/localhost:8080["'`]\s*:\s*["'`]https:\/\/sf\.doaguru\.com["'`]\s*\)/g, '"https://sf.doaguru.com"');
  
  content = content.replace(/window\.location\.hostname\s*===\s*["'`]localhost["'`]\s*\?\s*\(\s*window\.API_BASE\s*\|\|\s*["'`]http:\/\/localhost:8080["'`]\s*\)\s*:\s*["'`]https:\/\/sf\.doaguru\.com["'`]/g, '"https://sf.doaguru.com"');
  
  content = content.replace(/window\.location\.hostname\s*===\s*["'`]localhost["'`]\s*\?\s*window\.API_BASE\s*:\s*["'`]https:\/\/sf\.doaguru\.com["'`]/g, '"https://sf.doaguru.com"');
  
  content = content.replace(/window\.location\.hostname\s*===\s*["'`]localhost["'`]\s*\?\s*["'`]http:\/\/localhost:8080["'`]\s*:\s*["'`]https:\/\/sf\.doaguru\.com["'`]/g, '"https://sf.doaguru.com"');
  
  content = content.replace(/window\.location\.hostname\s*===\s*["'`]localhost["'`]\s*\?\s*process\.env\.REACT_APP_API_URL\s*:\s*(?:process\.env\.REACT_APP_API_URL\s*\|\|\s*["'`]https:\/\/sf\.doaguru\.com["'`])/g, '"https://sf.doaguru.com"');
  
  content = content.replace(/process\.env\.REACT_APP_API_URL\s*\|\|\s*["'`]https:\/\/sf\.doaguru\.com["'`]/g, '"https://sf.doaguru.com"');

  // Catch all multiline instances for localhost hostname check to sf.doaguru.com
  content = content.replace(/window\.location\.hostname\s*===\s*["'`]localhost["'`][\s\S]*?\s*:\s*["'`]https:\/\/sf\.doaguru\.com["'`]/g, '"https://sf.doaguru.com"');

  // Also replace `"https://sf.doaguru.com"` if any remains
  content = content.replace(/\(\s*window\.API_BASE\s*\|\|\s*["'`]https:\/\/sf\.doaguru\.com["'`]\s*\)/g, '"https://sf.doaguru.com"');

  if (content !== orig) {
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
  }
});
