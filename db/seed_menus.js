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
    { category: 'recommended', badge: 'SIGNATURE', name: '모둠 숙성회', price: '시가', image_url: '/images/foods/물고기자리 연출컷-1.jpg', is_main: 1, sort_order: 1 },
    { category: 'recommended', badge: 'POPULAR', name: '모둠 초밥', price: '28,000원', image_url: '/images/foods/초밥.jpg', is_main: 0, sort_order: 2 },
    { category: 'recommended', badge: 'BEST', name: '생선 매운탕', price: '18,000원', image_url: '/images/foods/매운탕.jpg', is_main: 0, sort_order: 3 },
    { category: 'recommended', badge: 'NEW', name: '셰프 특선 회', price: '시가', image_url: '/images/foods/물고기자리 연출컷-4.jpg', is_main: 0, sort_order: 4 },

    // 2. 숙성회 (sashimi)
    { category: 'sashimi', badge: 'PREMIUM', name: '광어 숙성회', price: '시가', image_url: '/images/foods/물고기자리 연출컷-2.jpg', is_main: 1, sort_order: 1 },
    { category: 'sashimi', badge: 'SEASON', name: '멍게', price: '15,000원', image_url: '/images/foods/멍게.jpg', is_main: 0, sort_order: 2 },
    { category: 'sashimi', badge: 'FRESH', name: '참돔 숙성회', price: '시가', image_url: '/images/foods/물고기자리 연출컷-5.jpg', is_main: 0, sort_order: 3 },
    { category: 'sashimi', badge: 'LIVE', name: '산낙지', price: '25,000원', image_url: '/images/foods/산낙지.jpg', is_main: 0, sort_order: 4 },

    // 3. 특선메뉴 (special)
    { category: 'special', badge: "CHEF'S PICK", name: '도미 머리구이', price: '35,000원', image_url: '/images/foods/도미머리구이.jpg', is_main: 1, sort_order: 1 },
    { category: 'special', badge: 'SPECIAL', name: '모둠 마끼', price: '22,000원', image_url: '/images/foods/마끼.jpg', is_main: 0, sort_order: 2 },
    { category: 'special', badge: 'GRILLED', name: '마늘버섯구이', price: '16,000원', image_url: '/images/foods/마늘버섯구이.jpg', is_main: 0, sort_order: 3 },
    { category: 'special', badge: 'LIMITED', name: '특선 코스', price: '시가', image_url: '/images/foods/물고기자리 연출컷-7.jpg', is_main: 0, sort_order: 4 },

    // 4. 사이드 (side)
    { category: 'side', badge: 'SIDE', name: '모둠 튀김', price: '18,000원', image_url: '/images/foods/skidashe.webp', is_main: 1, sort_order: 1 },
    { category: 'side', badge: 'HOT', name: '닭강정', price: '16,000원', image_url: '/images/foods/닭강정.jpg', is_main: 0, sort_order: 2 },
    { category: 'side', badge: 'KIDS', name: '새우 가스', price: '14,000원', image_url: '/images/foods/새우가스.jpg', is_main: 0, sort_order: 3 },
    { category: 'side', badge: 'NOODLE', name: '볶음 우동', price: '12,000원', image_url: '/images/foods/볶음우동.jpg', is_main: 0, sort_order: 4 },

    // 5. 점심특선 (lunch)
    { category: 'lunch', badge: 'LUNCH', name: '점심 특선 A코스', price: '30,000원', image_url: '/images/foods/물고기자리 연출컷-10.jpg', is_main: 1, sort_order: 1 },
    { category: 'lunch', badge: 'SIMPLE', name: '점심 라면 세트', price: '10,000원', image_url: '/images/foods/라면.jpg', is_main: 0, sort_order: 2 },
    { category: 'lunch', badge: 'LUNCH', name: '점심 돈가스', price: '13,000원', image_url: '/images/foods/돈가스.jpg', is_main: 0, sort_order: 3 },
    { category: 'lunch', badge: 'LUNCH', name: '점심 특선 B코스', price: '38,000원', image_url: '/images/foods/물고기자리 연출컷-11.jpg', is_main: 0, sort_order: 4 },

    // 6. 세트메뉴 (set)
    { category: 'set', badge: 'SET A', name: '2인 프리미엄 세트', price: '98,000원', image_url: '/images/foods/물고기자리 연출컷-12.jpg', is_main: 1, sort_order: 1 },
    { category: 'set', badge: 'SET B', name: '4인 가족 세트', price: '178,000원', image_url: '/images/foods/물고기자리 연출컷-3.jpg', is_main: 0, sort_order: 2 },
    { category: 'set', badge: 'SET C', name: '비즈니스 세트', price: '협의', image_url: '/images/foods/물고기자리 연출컷-6.jpg', is_main: 0, sort_order: 3 },
    { category: 'set', badge: 'SET D', name: '파티 풀코스', price: '협의', image_url: '/images/foods/물고기자리 연출컷-9.jpg', is_main: 0, sort_order: 4 }
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
