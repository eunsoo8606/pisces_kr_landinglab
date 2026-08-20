const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const storesDir = path.join(__dirname, 'public/images/stores');

const mappings = [
    { src: '물고기자리정자점.jpg', krWebp: '물고기자리정자점.webp', enWebp: 'store_jeongja.webp' },
    { src: '물고기자리본점.jpg', krWebp: '물고기자리본점.webp', enWebp: 'store_bonjeom.webp' },
    { src: '물고기자리논현점.jpg', krWebp: '물고기자리논현점.webp', enWebp: 'store_nonhyeon.webp' },
    { src: '물고기자리잠실점.jpg', krWebp: '물고기자리잠실점.webp', enWebp: 'store_jamsil.webp' },
    { src: '물고기자리동탄점.jpg', krWebp: '물고기자리동탄점.webp', enWebp: 'store_dongtan.webp' },
    { src: '물고기자리사당점.jpg', krWebp: '물고기자리사당점.webp', enWebp: 'store_sadang.webp' }
];

async function convertImages() {
    console.log('🖼️ 가게 이미지 WebP 변환 및 최적화 작업 시작...');

    for (const item of mappings) {
        const srcPath = path.join(storesDir, item.src);
        if (fs.existsSync(srcPath)) {
            const krPath = path.join(storesDir, item.krWebp);
            const enPath = path.join(storesDir, item.enWebp);

            // WebP 품질 85% 변환
            await sharp(srcPath)
                .webp({ quality: 85 })
                .toFile(krPath);

            await sharp(srcPath)
                .webp({ quality: 85 })
                .toFile(enPath);

            console.log(`✅ 변환 완료: ${item.src} -> ${item.krWebp} / ${item.enWebp}`);
        } else {
            console.warn(`⚠️ 파일을 찾을 수 없습니다: ${item.src}`);
        }
    }

    console.log('🎉 모든 가게 이미지 WebP 변환이 성공적으로 완료되었습니다!');
}

convertImages().catch(err => {
    console.error('❌ WebP 변환 중 에러 발생:', err);
});
