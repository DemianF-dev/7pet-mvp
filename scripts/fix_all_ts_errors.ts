import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string, callback: (filePath: string) => void) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            walk(filePath, callback);
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            callback(filePath);
        }
    });
}

const srcDir = path.join(process.cwd(), 'backend', 'src');
console.log(`🚀 Starting TS fix script in ${srcDir}...`);

walk(srcDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace catch (error) with catch (error: any)
    // Using regex to handle various spacing
    content = content.replace(/catch\s*\(error\)\s*\{/g, 'catch (error: any) {');

    // Also handle catch(err) or other variants if common, but focusing on 'error'
    content = content.replace(/catch\s*\(err\)\s*\{/g, 'catch (err: any) {');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed catch blocks in: ${filePath}`);
    }
});

console.log('✨ All catch blocks standardized.');
