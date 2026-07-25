const fs = require('fs');

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // 대표 대용량 이미지 경로들을 .webp 로 교체
    const replacements = [
        ['/images/delivery.png', '/images/delivery.webp'],
        ['/images/pack.png', '/images/pack.webp'],
        ['/images/filet-work1.png', '/images/filet-work1.webp'],
        ['/images/filet-work2.png', '/images/filet-work2.webp'],
        ['/images/filet-work3.png', '/images/filet-work3.webp'],
        ['/images/sashimi-set.png', '/images/sashimi-set.webp'],
        ['/images/maker.png', '/images/maker.webp'],
        ['/images/store2.png', '/images/store2.webp'],
        ['/images/main-food.png', '/images/main-food.webp'],
        ['/images/fork.png', '/images/fork.webp'],
        ['/images/fresh_flatfish.png', '/images/fresh_flatfish.webp'],
        ['/images/guang_fish.png', '/images/guang_fish.webp'],
        ['/images/gagong.png', '/images/gagong.webp'],
        ['/images/trouble_kitchen.png', '/images/trouble_kitchen.webp'],
        ['/images/trouble_market.png', '/images/trouble_market.webp'],
        ['/images/trouble_tank.png', '/images/trouble_tank.webp'],
        ['/images/restorant.png', '/images/restorant.webp'],
        ['/images/foods/hot-soop.png', '/images/foods/hot-soop.webp'],
        ['/images/foods/tukim.png', '/images/foods/tukim.webp'],
        ['/images/sec9_img2.png', '/images/sec9_img2.webp'],
        ['/images/sec9_img3.png', '/images/sec9_img3.webp'],
        ['/images/premium.jpg', '/images/premium.webp'],
        ['/images/room/room1.jpg', '/images/room/room1.webp'],
        ['/images/room/room2.jpg', '/images/room/room2.webp'],
        ['/images/room/room3.jpg', '/images/room/room3.webp'],
        ['/images/room/room4.jpg', '/images/room/room4.webp']
    ];

    replacements.forEach(([from, to]) => {
        content = content.replaceAll(from, to);
    });

    // /images/foods/ 폴더 내 .jpg 및 .png 확장자를 .webp 로 교체
    content = content.replace(/\/images\/foods\/([^"'\s]+)\.(jpg|png)/g, '/images/foods/$1.webp');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated image paths in ${filePath}`);
    }
}

updateFile('./views/index.ejs');
updateFile('./public/css/style.css');
