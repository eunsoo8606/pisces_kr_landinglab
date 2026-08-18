// menus 테이블 생성 및 기본 24개 메뉴 데이터(시드) 주입 스크립트
require('dotenv').config();
const db = require('./database');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS menus (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 번호',
    category VARCHAR(20) NOT NULL COMMENT '메뉴 종류 (recommended, sashimi, special, side, lunch, set)',
    badge VARCHAR(50) DEFAULT NULL COMMENT '카드 뱃지/라벨 (SIGNATURE, POPULAR, BEST, NEW 등)',
    name VARCHAR(100) NOT NULL COMMENT '메뉴 이름',
    price VARCHAR(50) NOT NULL COMMENT '메뉴 가격 (시가, 28,000원 등)',
    image_url VARCHAR(255) NOT NULL COMMENT '이미지 경로 (예: /images/foods/초밥.jpg)',
    is_main TINYINT(1) DEFAULT 0 COMMENT '메인 카드 여부 (1: 메인, 0: 일반)',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='메뉴 음식 테이블';
`;

const indexes = [
    `CREATE INDEX idx_menus_category ON menus(category);`,
    `CREATE INDEX idx_menus_sort_order ON menus(sort_order);`
];

const seedData = [
    // 1. 추천메뉴 (recommended)
    { category: 'recommended', badge: 'SIGNATURE', name: '모둠 숙성회 1인 코스', price: '42,000원', image_url: '/images/foods/물고기자리 연출컷-1.jpg', is_main: 1, sort_order: 1 },
    { category: 'recommended', badge: 'WINTER SPECIAL', name: '[겨울한정] 1인 코스', price: '52,000원', image_url: '/images/foods/물고기자리 연출컷-4.jpg', is_main: 0, sort_order: 2 },
    { category: 'recommended', badge: 'BEST SAKE', name: '물고기자리 준마이', price: '40,000원', image_url: '/images/foods/메인횟집.jpg', is_main: 0, sort_order: 3 },
    { category: 'recommended', badge: 'POPULAR', name: '도미 머리구이', price: '10,000원', image_url: '/images/foods/도미머리구이.jpg', is_main: 0, sort_order: 4 },

    // 2. 숙성회 코스 (sashimi)
    { category: 'sashimi', badge: 'MAIN COURSE', name: '모둠 숙성회 1인 코스', price: '42,000원', image_url: '/images/foods/물고기자리 연출컷-2.jpg', is_main: 1, sort_order: 1 },
    { category: 'sashimi', badge: 'SEASON', name: '[겨울한정] 대방어 코스', price: '52,000원', image_url: '/images/foods/물고기자리 연출컷-5.jpg', is_main: 0, sort_order: 2 },
    { category: 'sashimi', badge: 'FRESH', name: '산낙지 / 전복', price: '10,000원', image_url: '/images/foods/산낙지.jpg', is_main: 0, sort_order: 3 },
    { category: 'sashimi', badge: 'FRESH', name: '싱싱한 멍게', price: '5,000원', image_url: '/images/foods/멍게.jpg', is_main: 0, sort_order: 4 },

    // 3. 단품메뉴 (side)
    { category: 'side', badge: "CHEF'S PICK", name: '도미 머리구이', price: '10,000원', image_url: '/images/foods/도미머리구이.jpg', is_main: 1, sort_order: 1 },
    { category: 'side', badge: 'BEST SIDE', name: '새우튀김', price: '10,000원', image_url: '/images/foods/skidashe.webp', is_main: 0, sort_order: 2 },
    { category: 'side', badge: 'SOUP', name: '서더리 매운탕', price: '10,000원', image_url: '/images/foods/매운탕.jpg', is_main: 0, sort_order: 3 },
    { category: 'side', badge: 'NOODLE', name: '해물 얼큰 라면', price: '8,000원', image_url: '/images/foods/라면.jpg', is_main: 0, sort_order: 4 },
    { category: 'side', badge: 'SNACK', name: '수제 닭강정', price: '3,000원', image_url: '/images/foods/닭강정.jpg', is_main: 0, sort_order: 5 },
    { category: 'side', badge: 'SIDE', name: '마늘 버섯구이', price: '3,000원', image_url: '/images/foods/마늘버섯구이.jpg', is_main: 0, sort_order: 6 },
    { category: 'side', badge: 'KIDS', name: '바삭한 돈까스', price: '5,000원', image_url: '/images/foods/돈가스.jpg', is_main: 0, sort_order: 7 },
    { category: 'side', badge: 'ADD-ON', name: '초밥밥', price: '3,000원', image_url: '/images/foods/초밥.jpg', is_main: 0, sort_order: 8 },

    // 4. 사케 라인업 (sake)
    { category: 'sake', badge: 'PREMIUM SAKE', name: '쿠보타 만쥬', price: '240,000원', image_url: '/images/foods/menu12.webp', is_main: 1, sort_order: 1 },
    { category: 'sake', badge: 'LUXURY', name: '닷사이 준마이다이긴죠39', price: '130,000원', image_url: '/images/foods/물고기자리 연출컷-12.jpg', is_main: 0, sort_order: 2 },
    { category: 'sake', badge: 'LIMITED', name: '쿠보타 준마이다이긴죠', price: '110,000원', image_url: '/images/foods/물고기자리 연출컷-3.jpg', is_main: 0, sort_order: 3 },
    { category: 'sake', badge: 'BEST', name: '쿠보타 센쥬', price: '90,000원', image_url: '/images/foods/물고기자리 연출컷-6.jpg', is_main: 0, sort_order: 4 },
    { category: 'sake', badge: 'RECOMMEND', name: '사쿠라 준마이', price: '65,000원', image_url: '/images/foods/물고기자리 연출컷-7.jpg', is_main: 0, sort_order: 5 },
    { category: 'sake', badge: 'TRADITIONAL', name: '가모츠루 혼조조 가라구치', price: '55,000원', image_url: '/images/foods/물고기자리 연출컷-8.jpg', is_main: 0, sort_order: 6 },
    { category: 'sake', badge: 'SPECIAL SALE', name: '물고기자리 준마이', price: '40,000원', image_url: '/images/foods/메인횟집.jpg', is_main: 0, sort_order: 7 },
    { category: 'sake', badge: 'AWARD', name: '송죽매 준마이 750', price: '37,000원', image_url: '/images/foods/물고기자리 연출컷-9.jpg', is_main: 0, sort_order: 8 }
];

async function main() {
    try {
        console.log('Connecting to database and creating menus table...');
        await db.query(createTableQuery);
        console.log('✅ menus table created successfully.');

        // 인덱스 생성 시도
        for (const idxQuery of indexes) {
            try {
                await db.query(idxQuery);
            } catch (e) {
                // 인덱스가 이미 존재할 경우 통과
            }
        }
        console.log('✅ Indexes configured.');

        // 기존 데이터가 존재하는지 체크
        const [existing] = await db.query('SELECT COUNT(*) as count FROM menus');
        if (existing[0].count > 0) {
            console.log('⚠️ menus table already has data. Seeding skipped.');
            process.exit(0);
        }

        console.log('Inserting seed data into menus...');
        for (const item of seedData) {
            await db.query(
                `INSERT INTO menus (category, badge, name, price, image_url, is_main, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [item.category, item.badge, item.name, item.price, item.image_url, item.is_main, item.sort_order]
            );
        }
        console.log(`✅ Seeding complete. ${seedData.length} menu items inserted.`);
    } catch (err) {
        console.error('❌ Error during seeding:', err);
    } finally {
        process.exit(0);
    }
}

main();
