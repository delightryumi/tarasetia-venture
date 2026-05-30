const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const replacements = {
    'bg-slate-50': 'bg-[var(--surface-alt)]',
    'bg-slate-100': 'bg-[var(--surface-alt)]',
    'bg-slate-200': 'bg-[var(--border-light)]',
    'text-slate-900': 'text-[var(--rich-black)]',
    'text-slate-800': 'text-[var(--rich-black)]',
    'text-slate-600': 'text-[var(--sage)]',
    'text-slate-500': 'text-[var(--sage)]',
    'text-slate-400': 'text-[var(--sage)]',
    'text-slate-300': 'text-[var(--sage-light)]',
    'border-slate-100': 'border-[var(--border-light)]',
    'border-slate-200': 'border-[var(--border-light)]',
    'border-t-terracotta': 'border-t-[var(--peach)]',
    'bg-[var(--surface-alt)] min-h-screen': 'min-h-[calc(100vh-100px)]',
};

let count = 0;
walkDir('./components/sections', function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let original = content;

        for (const [oldStr, newStr] of Object.entries(replacements)) {
            // Regex replace all occurrences
            content = content.replace(new RegExp(oldStr, 'g'), newStr);
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf-8');
            count++;
            console.log("Updated: " + filePath);
        }
    }
});
console.log("Updated " + count + " files.");
