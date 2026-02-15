
import fs from 'fs';

const filePath = 'c:/Users/oidem/antigravity/scratch/7pet-mvp/backend/src/services/quoteService.ts';
const buffer = fs.readFileSync(filePath);

// Detect if it's UTF-16 (le or be) or has weird NULLs
let content = '';
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le');
} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    content = buffer.toString('utf16be');
} else {
    // Try to strip nulls if it's just corrupted ASCII
    content = buffer.toString('utf8').replace(/\0/g, '');
}

// Clean any double spaces if they exist but shouldn't (though null stripping handles the usual case)

fs.writeFileSync(filePath, content, 'utf8');
console.log('Normalized encoding for quoteService.ts');
