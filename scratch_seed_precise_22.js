require('dotenv').config();
const db = require('./db/database');

const preciseStores = [
    { name: '물고기자리 본점', address: '경기도 용인시 수지구 풍덕천로 155 지상 1층 (풍덕천동, 수지마을동보아파트)', phone: '031-266-3392', lat: 37.325543, lng: 127.096312 },
    { name: '물고기자리 정자점', address: '경기도 성남시 분당구 정자로 120 111호 지상 1층 (정자동, 삼성아데나루체)', phone: '031-711-2234', lat: 37.361543, lng: 127.110292 },
    { name: '물고기자리 논현점', address: '서울 강남구 학동로4길 39 지상 1층~2층 (논현동)', phone: '02-545-2234', lat: 37.510312, lng: 127.022543 },
    { name: '물고기자리 잠실점', address: '서울 송파구 올림픽로10길 8 지상 1층', phone: '02-418-2234', lat: 37.510842, lng: 127.080512 },
    { name: '물고기자리 상암점', address: '서울 마포구 월드컵북로48길 14-6 지상 1층', phone: '02-304-2234', lat: 37.577212, lng: 126.897453 },
    { name: '물고기자리 구로디지털점', address: '서울 구로구 디지털로34길 55 지하 1층', phone: '02-858-2234', lat: 37.484215, lng: 126.897532 },
    { name: '물고기자리 사당점', address: '서울 서초구 방배천로2길 21 지상 2층', phone: '02-588-2234', lat: 37.477543, lng: 126.982215 },
    { name: '물고기자리 가락시장점', address: '서울 송파구 송파대로28길 27 101동 206호 지상 2층', phone: '02-401-2234', lat: 37.494712, lng: 127.121543 },
    { name: '물고기자리 야탑점', address: '경기도 성남시 분당구 장미로108번길 15 지상 1층', phone: '031-708-2234', lat: 37.411916, lng: 127.133036 },
    { name: '물고기자리 서현점', address: '경기도 성남시 분당구 분당로53번길 19 지하 1층', phone: '031-705-2234', lat: 37.384471, lng: 127.122077 },
    { name: '물고기자리 경기광주점', address: '경기도 광주시 문화로 29 지상 1층', phone: '031-766-2234', lat: 37.407066, lng: 127.255355 },
    { name: '물고기자리 영통점', address: '경기도 수원시 영통구 청명남로34번길 21 지상 2층', phone: '031-205-4456', lat: 37.252288, lng: 127.076728 },
    { name: '물고기자리 동탄점', address: '경기도 화성시 동탄지성로 2 지상 2층', phone: '031-8003-2234', lat: 37.220327, lng: 127.051921 },
    { name: '물고기자리 평촌점', address: '경기도 안양시 동안구 관평로182번길 43 지상 1층', phone: '031-388-2234', lat: 37.394080, lng: 126.962570 },
    { name: '물고기자리 화성점', address: '경기도 화성시 남양읍 역골동로 10-17 지상 1층', phone: '031-355-2234', lat: 37.209784, lng: 126.830951 },
    { name: '물고기자리 향남점', address: '경기도 화성시 향남읍 대밭로 47 지상 2층', phone: '031-353-2234', lat: 37.134512, lng: 126.923412 },
    { name: '물고기자리 평택고덕점', address: '경기도 평택시 고덕어염10길 76 지상 1층', phone: '031-665-2234', lat: 37.042534, lng: 127.045621 },
    { name: '물고기자리 영일대점', address: '경북 포항시 북구 두호로 8 지상 1층', phone: '054-252-2234', lat: 36.059812, lng: 129.378945 },
    { name: '물고기자리 검단신도시아라역점', address: '인천 서구 원당대로 1039 지상 1층', phone: '032-567-2234', lat: 37.594512, lng: 126.678912 },
    { name: '물고기자리 당감점', address: '부산 부산진구 당감서로80번길 22 지상 1층', phone: '051-891-2234', lat: 35.167494, lng: 129.037819 },
    { name: '물고기자리 용인시청점', address: '경기도 용인시 처인구 성산로 6 지상 1층', phone: '031-338-2234', lat: 37.239512, lng: 127.178234 },
    { name: '물고기자리 병점점', address: '경기도 화성시 병점중앙로156번길 5 지상 1층', phone: '031-222-2234', lat: 37.206712, lng: 127.034512 }
];

async function updatePreciseStores() {
    console.log('🔄 22개 정밀 지점 DB 동기화 업데이트 시작...');

    await db.query('TRUNCATE TABLE stores');

    for (let i = 0; i < preciseStores.length; i++) {
        const item = preciseStores[i];
        await db.query(
            'INSERT INTO stores (name, address, phone, lat, lng, use_yn) VALUES (?, ?, ?, ?, ?, ?)',
            [item.name, item.address, item.phone, item.lat, item.lng, 'Y']
        );
        console.log(`[${i + 1}/${preciseStores.length}] 📍 ${item.name} (${item.address}) -> 위도: ${item.lat}, 경도: ${item.lng}`);
    }

    console.log('✨ 22개 전체 가맹점 DB 동기화가 성공적으로 끝났습니다!');
    process.exit(0);
}

updatePreciseStores().catch(err => {
    console.error('❌ DB 업데이트 실패:', err);
    process.exit(1);
});
