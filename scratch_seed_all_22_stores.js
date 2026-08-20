require('dotenv').config();
const db = require('./db/database');

const rawStores = [
    { name: '물고기자리 본점', address: '경기도 용인시 수지구 풍덕천로 155 (풍덕천동, 수지마을동보아파트)', floor: '지상 1층', phone: '031-266-3392' },
    { name: '물고기자리 정자점', address: '경기도 성남시 분당구 정자로 120 111호 (정자동, 삼성아데나루체)', floor: '지상 1층', phone: '031-711-2234' },
    { name: '물고기자리 논현점', address: '서울 강남구 학동로4길 39 (논현동)', floor: '지상 1층~2층', phone: '02-545-2234' },
    { name: '물고기자리 잠실점', address: '서울 송파구 올림픽로10길 8', floor: '지상 1층', phone: '02-418-2234' },
    { name: '물고기자리 상암점', address: '서울 마포구 월드컵북로48길 14-6', floor: '지상 1층', phone: '02-304-2234' },
    { name: '물고기자리 구로디지털점', address: '서울 구로구 디지털로34길 55', floor: '지하 1층', phone: '02-858-2234' },
    { name: '물고기자리 사당점', address: '서울 서초구 방배천로2길 21', floor: '지상 2층', phone: '02-588-2234' },
    { name: '물고기자리 가락시장점', address: '서울 송파구 송파대로28길 27 101동 206호', floor: '지상 2층', phone: '02-401-2234' },
    { name: '물고기자리 야탑점', address: '경기도 성남시 분당구 장미로108번길 15', floor: '지상 1층', phone: '031-708-2234' },
    { name: '물고기자리 서현점', address: '경기도 성남시 분당구 분당로53번길 19', floor: '지하 1층', phone: '031-705-2234' },
    { name: '물고기자리 경기광주점', address: '경기도 광주시 문화로 29', floor: '지상 1층', phone: '031-766-2234' },
    { name: '물고기자리 영통점', address: '경기도 수원시 영통구 청명남로34번길 21', floor: '지상 2층', phone: '031-205-4456' },
    { name: '물고기자리 동탄점', address: '경기도 화성시 동탄지성로 2', floor: '지상 2층', phone: '031-8003-2234' },
    { name: '물고기자리 평촌점', address: '경기도 안양시 동안구 관평로182번길 43', floor: '지상 1층', phone: '031-388-2234' },
    { name: '물고기자리 화성점', address: '경기도 화성시 남양읍 역골동로 10-17', floor: '지상 1층', phone: '031-355-2234' },
    { name: '물고기자리 향남점', address: '경기도 화성시 향남읍 대밭로 47', floor: '지상 2층', phone: '031-353-2234' },
    { name: '물고기자리 평택고덕점', address: '경기도 평택시 고덕어염10길 76', floor: '지상 1층', phone: '031-665-2234' },
    { name: '물고기자리 영일대점', address: '경북 포항시 북구 두호로 8', floor: '지상 1층', phone: '054-252-2234' },
    { name: '물고기자리 검단신도시아라역점', address: '인천 서구 원당대로 1039', floor: '지상 1층', phone: '032-567-2234' },
    { name: '물고기자리 당감점', address: '부산 부산진구 당감서로80번길 22', floor: '지상 1층', phone: '051-891-2234' },
    { name: '물고기자리 용인시청점', address: '경기도 용인시 처인구 성산로 6', floor: '지상 1층', phone: '031-338-2234' },
    { name: '물고기자리 병점점', address: '경기도 화성시 병점중앙로156번길 5', floor: '지상 1층', phone: '031-222-2234' }
];

// Kakao Local Geocoding API 또는 Nominatim/VWorld로 위경도 검색 헬퍼
async function getCoordinates(address) {
    const cleanAddr = address.split('(')[0].trim(); // 괄호 부가설명 제거 검색
    const kakaoRestKey = process.env.KAKAO_REST_API_KEY || '32d21192c59a01f88208043771e1a27d';

    // 1. 카카오 로컬 API 시도
    try {
        const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(cleanAddr)}`, {
            headers: { 'Authorization': `KakaoAK ${kakaoRestKey}` }
        });
        const data = await response.json();
        if (data.documents && data.documents.length > 0) {
            const doc = data.documents[0];
            return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
        }
    } catch (err) {
        console.warn(`Kakao API failed for: ${cleanAddr}`, err.message);
    }

    // 2. OpenStreetMap Nominatim Fallback
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddr)}`, {
            headers: { 'User-Agent': 'PiscesLandingApp/1.0' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (err) {
        console.warn(`Nominatim API failed for: ${cleanAddr}`, err.message);
    }

    // 3. 지점별 디폴트 위치 좌표 (대한민국 중심부 근처 또는 37.5665, 126.9780)
    return { lat: 37.5665, lng: 126.9780 };
}

async function seedStores() {
    console.log('🚀 22개 가맹점 DB 일괄 입력 시작...');

    // 테이블 보장
    await db.query(`
        CREATE TABLE IF NOT EXISTS stores (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            address VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            lat DECIMAL(10, 7) NOT NULL,
            lng DECIMAL(10, 7) NOT NULL,
            use_yn CHAR(1) DEFAULT 'Y',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 기존 데이터 초기화 후 22개 매장 등록
    await db.query('TRUNCATE TABLE stores');

    for (let i = 0; i < rawStores.length; i++) {
        const item = rawStores[i];
        const fullAddr = `${item.address} ${item.floor}`;
        const coords = await getCoordinates(item.address);

        await db.query(
            'INSERT INTO stores (name, address, phone, lat, lng, use_yn) VALUES (?, ?, ?, ?, ?, ?)',
            [item.name, fullAddr, item.phone, coords.lat, coords.lng, 'Y']
        );
        console.log(`[${i + 1}/${rawStores.length}] ✅ 등록 완료: ${item.name} (${fullAddr}) -> 위도: ${coords.lat}, 경도: ${coords.lng}`);
    }

    console.log('🎉 22개 가맹점 매장 데이터 일괄 등록이 완벽하게 완료되었습니다!');
    process.exit(0);
}

seedStores().catch(err => {
    console.error('❌ Error seeding 22 stores:', err);
    process.exit(1);
});
