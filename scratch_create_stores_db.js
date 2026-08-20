// stores 테이블 자동 생성 및 초기 데이터 삽입 스크립트
require('dotenv').config();
const db = require('./db/database');

const query = `
CREATE TABLE IF NOT EXISTS stores (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '매장 고유 번호',
    name VARCHAR(100) NOT NULL COMMENT '매장명',
    address VARCHAR(255) NOT NULL COMMENT '매장 주소',
    phone VARCHAR(50) DEFAULT NULL COMMENT '매장 연락처',
    lat DECIMAL(10, 7) NOT NULL COMMENT '위도',
    lng DECIMAL(10, 7) NOT NULL COMMENT '경도',
    use_yn VARCHAR(1) DEFAULT 'Y' COMMENT '노출 여부 (Y: 노출, N: 숨김)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='가맹점/매장 현황 테이블';
`;

const sampleStores = [
    ['물고기자리 본점 (정자점)', '경기도 성남시 분당구 성남대로331번길 3-3', '031-711-2234', 37.361543, 127.110292, 'Y'],
    ['물고기자리 강남역점', '서울특별시 강남구 테헤란로4길 46', '02-556-3345', 37.496521, 127.030588, 'Y'],
    ['물고기자리 수원망포점', '경기도 수원시 영통구 영통로 130-1', '031-205-4456', 37.243588, 127.058334, 'Y'],
    ['물고기자리 인천송도점', '인천광역시 연수구 컨벤시아대로 80', '032-831-5567', 37.393452, 126.652311, 'Y'],
    ['물고기자리 일산대화점', '경기도 고양시 일산서구 대화로 123', '031-921-6678', 37.675688, 126.748332, 'Y']
];

async function main() {
    try {
        console.log('Connecting to database and creating stores table...');
        await db.query(query);
        console.log('✅ Stores table created successfully.');

        // 기존 데이터 있는지 확인
        const [rows] = await db.query('SELECT COUNT(*) as count FROM stores');
        if (rows[0].count === 0) {
            console.log('Inserting initial sample store records...');
            for (const store of sampleStores) {
                await db.query(
                    'INSERT INTO stores (name, address, phone, lat, lng, use_yn) VALUES (?, ?, ?, ?, ?, ?)',
                    store
                );
            }
            console.log('✅ Initial store records inserted.');
        } else {
            console.log(`ℹ️ Stores table already has ${rows[0].count} records.`);
        }
    } catch (err) {
        console.error('❌ Error creating stores table:', err);
    } finally {
        process.exit(0);
    }
}

main();
