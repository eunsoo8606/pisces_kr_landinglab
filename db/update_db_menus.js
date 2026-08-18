// DB menus 테이블 데이터 직접 갱신 스크립트
require('dotenv').config();
const db = require('./database');

const seedData = [
    // 1. 추천메뉴 (recommended) - 1인 코스, 겨울한정 대방어 코스, 사이드 메뉴 3종
    { category: 'recommended', badge: 'SIGNATURE', name: '모둠 숙성회 1인 코스', price: '42,000원', image_url: '/images/foods/물고기자리 연출컷-1.jpg', is_main: 1, sort_order: 1 },
    { category: 'recommended', badge: 'WINTER LIMITED', name: '[겨울한정] 1인 코스', price: '52,000원', image_url: '/images/foods/물고기자리 연출컷-5.jpg', is_main: 1, sort_order: 2 },
    { category: 'recommended', badge: "CHEF'S PICK", name: '도미 머리구이', price: '10,000원', image_url: '/images/foods/도미머리구이.jpg', is_main: 0, sort_order: 3 },
    { category: 'recommended', badge: 'BEST SIDE', name: '새우튀김', price: '10,000원', image_url: '/images/foods/skidashe.webp', is_main: 0, sort_order: 4 },
    { category: 'recommended', badge: 'SOUP', name: '서더리 매운탕', price: '10,000원', image_url: '/images/foods/매운탕.jpg', is_main: 0, sort_order: 5 },

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

async function updateDb() {
    try {
        console.log('🔄 Clearing old DB menus records and inserting fresh records...');
        await db.query('TRUNCATE TABLE menus');
        
        for (const item of seedData) {
            await db.query(
                `INSERT INTO menus (category, badge, name, price, image_url, is_main, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [item.category, item.badge, item.name, item.price, item.image_url, item.is_main, item.sort_order]
            );
        }
        console.log(`✅ DB menus table updated successfully! Total ${seedData.length} records inserted.`);
    } catch (err) {
        console.error('❌ Failed to update DB menus:', err);
    } finally {
        process.exit(0);
    }
}

updateDb();
