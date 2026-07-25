const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processFile(filePath) {
    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    // 300KB 이상의 png, jpg, jpeg 파일 대상
    if ((ext === '.png' || ext === '.jpg' || ext === '.jpeg') && stat.size > 300 * 1024) {
        const webpPath = filePath.substring(0, filePath.lastIndexOf('.')) + '.webp';
        console.log(`Compressing ${filePath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);
        
        try {
            const image = sharp(filePath);
            const metadata = await image.metadata();
            
            // 너비가 1920px 초과 시 1920px로 웹 리사이징
            if (metadata.width && metadata.width > 1920) {
                image.resize({ width: 1920, fit: 'inside', withoutEnlargement: true });
            }
            
            await image
                .webp({ quality: 82, effort: 4 })
                .toFile(webpPath);
                
            const newStat = fs.statSync(webpPath);
            console.log(`  -> Created ${webpPath}: ${(newStat.size / 1024).toFixed(1)} KB (Saved ${((1 - newStat.size / stat.size) * 100).toFixed(1)}%)`);
        } catch (err) {
            console.error(`  -> Failed to compress ${filePath}:`, err.message);
        }
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            walkDir(p);
        } else {
            processFile(p);
        }
    }
}

console.log('Starting image compression...');
walkDir('./public/images');
console.log('Done image scan.');
