const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/Modernizacion/Documents/logistica-inteligente-refactor/frontend/src';

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            walk(filePath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            cleanFile(filePath);
        }
    });
}

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // 1. Remove 'use client'
    content = content.replace(/^["']use client["'];?\n?/gm, '');

    // 2. Remove import type ...
    content = content.replace(/^import\s+type\s+[\s\S]*?from\s+['"].*?['"];?\n?/gm, '');

    // 3. Remove interface definitions
    content = content.replace(/interface\s+\w+\s*({[\s\S]*?}|extends[\s\S]*?{[\s\S]*?})/g, '');

    // 4. Remove standalone type definitions
    content = content.replace(/^type\s+\w+\s*=\s*[\s\S]*?;/gm, '');
    content = content.replace(/\ntype\s+\w+\s*=\s*[\s\S]*?;/g, '');

    // 5. Remove React.forwardRef generics: React.forwardRef<T, P>(
    // Matches nested generics too
    while (content.includes('React.forwardRef<')) {
        const start = content.indexOf('React.forwardRef<');
        let level = 0;
        let end = -1;
        for (let i = start + 16; i < content.length; i++) {
            if (content[i] === '<') level++;
            else if (content[i] === '>') {
                if (level === 0) {
                    end = i;
                    break;
                }
                level--;
            }
        }
        if (end !== -1) {
            content = content.slice(0, start + 16) + content.slice(end + 1);
        } else {
            break;
        }
    }

    // 6. Remove hook generics: useState<T>(
    content = content.replace(/(useState|useRef|useMemo|useCallback|useContext|createContext)<[\s\S]*?>\s*\(/g, '$1(');

    // 7. Remove type annotations in function arguments: (arg: Type)
    // ONLY if it's a simple arg or part of a comma list
    // This regex is safer: matches ( \bword\b : \bType\b )
    content = content.replace(/(\b\w+\b)\s*:\s*[A-Z]\w+(?=\s*[,)])/g, '$1');
    content = content.replace(/(\b\w+\b)\s*:\s*["']\w+["'](?=\s*[,)])/g, '$1');

    // 8. Remove Props annotations in destructuring: ({ foo }: Props)
    content = content.replace(/\({([\s\S]*?)}\s*:\s*[A-Z]\w+/g, '({$1}');

    // 9. Remove return types: function foo(): Type {
    content = content.replace(/(\)\s*):\s*[A-Z]\w+(?=\s*{)/g, '$1');
    content = content.replace(/(\)\s*):\s*(void|string|number|boolean|any)(?=\s*{)/g, '$1');

    // 10. Remove "as const", "as any"
    content = content.replace(/\s+as\s+(const|any|string|number|boolean|unknown)\b/g, '');

    // 11. Fix specific radix naming if it was broken by "import { type X }"
    // (This part is reactive, I'll just be careful)

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned: ${filePath}`);
    }
}

walk(directory);
console.log("Cleanup finished.");
