import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDirs = [
  path.join(process.cwd(), 'src/features/seller/pages'),
  path.join(process.cwd(), 'src/features/seller/components'),
  path.join(process.cwd(), 'src/layouts')
];

let files = [];
targetDirs.forEach(dir => {
  walkDir(dir, (filepath) => {
    if (filepath.endsWith('.jsx')) {
      files.push(filepath);
    }
  });
});

let updatedCount = 0;

files.forEach(file => {
  // We only want to target SellerLayout in layouts
  if (file.includes('layouts') && !file.includes('SellerLayout.jsx')) return;

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Custom replacer for class attributes
  content = content.replace(/className=(["'}`])(.*?)\1/g, (match, quote, classes) => {
    let cls = classes.split(/\s+/);
    
    // Check if element has a colorful background that requires white text
    const hasColorfulBg = cls.some(c => 
      c.match(/bg-(blue|red|green|orange|purple|emerald|indigo|rose|pink|cyan|amber)-(500|600|700)/) ||
      c === 'bg-black' || c.includes('bg-emerald-') || c.includes('bg-red-')
    );

    let newCls = cls.map(c => {
      if (c === 'bg-slate-950') return 'bg-slate-50';
      if (c === 'bg-slate-900') return 'bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all duration-300';
      if (c === 'border-slate-800') return 'border-slate-200';
      if (c === 'border-slate-850') return 'border-slate-100';
      if (c === 'border-slate-700') return 'border-slate-300';
      
      if (c === 'text-slate-400') return 'text-slate-500';
      if (c === 'text-slate-300') return 'text-slate-600';
      if (c === 'text-slate-200') return 'text-slate-700';
      if (c === 'text-slate-100') return 'text-slate-800';
      if (c === 'text-slate-450') return 'text-slate-500';

      if (c === 'text-white' && !hasColorfulBg) return 'text-slate-900';
      if (c === 'hover:text-white' && !hasColorfulBg) return 'hover:text-slate-900';
      if (c === 'text-white/80' && !hasColorfulBg) return 'text-slate-700';
      if (c === 'text-white/60' && !hasColorfulBg) return 'text-slate-500';
      
      if (c === 'ring-slate-800') return 'ring-slate-200';
      if (c === 'divide-slate-800') return 'divide-slate-200';
      
      if (c === 'rounded-lg' || c === 'rounded-xl') return 'rounded-2xl';

      return c;
    });

    // Remove duplicates that might have been introduced
    newCls = [...new Set(newCls)];

    return `className=${quote}${newCls.join(' ')}${quote}`;
  });

  // Also replace template literals where className={`...`} is used
  content = content.replace(/'text-white'/g, () => {
    return "'text-slate-900'";
  });
  content = content.replace(/'text-slate-400'/g, "'text-slate-500'");
  content = content.replace(/'bg-slate-900'/g, "'bg-white shadow-sm ring-1 ring-slate-100'");
  content = content.replace(/'bg-slate-950'/g, "'bg-slate-50'");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`Updated ${path.basename(file)}`);
  }
});

console.log(`\nSuccessfully updated ${updatedCount} files.`);
