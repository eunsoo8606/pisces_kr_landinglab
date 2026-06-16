// 환경변수(.env) 로드
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// DB 연결 풀 임포트 (접속 로그 미들웨어용)
const db = require('./db/database');

// 라우터 모듈 임포트
const indexRealRouter = require('./routes/index');
const { router: authRouter } = require('./routes/auth');
const apiRouter = require('./routes/api');

// EJS 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 미들웨어
app.use(express.static(path.join(__dirname, 'public')));

// 요청 본문 파서 및 쿠키 파서 미들웨어
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// User Agent 분석 헬퍼 함수
function parseUserAgent(ua) {
    let deviceType = 'PC';
    let osName = 'Unknown';
    let browserName = 'Unknown';

    if (!ua) return { deviceType, osName, browserName };

    // 기기 판별
    if (/iPad|Tablet/i.test(ua)) {
        deviceType = 'Tablet';
    } else if (/Mobi|Android|iPhone|BlackBerry/i.test(ua)) {
        deviceType = 'Mobile';
    }

    // OS 판별
    if (/Windows/i.test(ua)) {
        osName = 'Windows';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
        osName = 'macOS';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
        osName = 'iOS';
    } else if (/Android/i.test(ua)) {
        osName = 'Android';
    } else if (/Linux/i.test(ua)) {
        osName = 'Linux';
    }

    // 브라우저 판별
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) {
        browserName = 'Chrome';
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
        browserName = 'Safari';
    } else if (/Firefox/i.test(ua)) {
        browserName = 'Firefox';
    } else if (/Edg/i.test(ua)) {
        browserName = 'Edge';
    } else if (/MSIE|Trident/i.test(ua)) {
        browserName = 'Internet Explorer';
    }

    return { deviceType, osName, browserName };
}

// IP 기반 국가 정보 추출 헬퍼 (ip-api 활용)
async function fetchCountryInfo(ip) {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return { country: 'Localhost', country_code: 'KR' };
    }
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await response.json();
        if (data.status === 'success') {
            return {
                country: data.country || 'Unknown',
                country_code: data.countryCode || 'XX'
            };
        }
    } catch (err) {
        console.error('Failed to fetch country geo info:', err.message);
    }
    return { country: 'Unknown', country_code: 'XX' };
}

// 전역 방문자 퍼스널 로그(visitor_logs) 수집 미들웨어
app.use((req, res, next) => {
    // 정적 자원 요청(css, js, 이미지 등)은 로그 대상에서 필터링
    const pathName = req.path;
    if (pathName.includes('.') || pathName.startsWith('/video') || pathName.startsWith('/images') || pathName.startsWith('/css') || pathName.startsWith('/js')) {
        return next();
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const cleanIp = ip.split(',')[0].trim(); // 프록시 IP 처리

    // 로컬 IP(IPv4 루프백, IPv6 루프백, 사설망 IP 대역 등)로 접근 시 DB 저장을 제외하고 진행
    if (!cleanIp || cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.')) {
        return next();
    }

    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';
    const requestedUrl = req.originalUrl || '';

    const { deviceType, osName, browserName } = parseUserAgent(userAgent);

    // 페이지 렌더링 속도 지연을 방지하기 위해 next()를 즉시 실행하고, 로그 수집은 백그라운드에서 비동기로 수행
    next();

    (async () => {
        try {
            const { country, country_code } = await fetchCountryInfo(cleanIp);
            await db.query(
                `INSERT INTO visitor_logs 
                 (ip_address, country, country_code, device_type, os_name, browser_name, referer, requested_url, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [cleanIp, country, country_code, deviceType, osName, browserName, referer, requestedUrl, userAgent]
            );
        } catch (err) {
            console.error('❌ Failed to save visitor log:', err);
        }
    })();
});

// 모든 템플릿에 baseUrl 주입
app.use((req, res, next) => {
    res.locals.baseUrl = `${req.protocol}://${req.get('host')}`;
    next();
});

// 라우터 마운트 (분리된 라우팅 모듈 등록)
app.use('/', indexRealRouter);
app.use('/', authRouter);
app.use('/', apiRouter);

// 로컬 개발 환경에서만 listen (Vercel 서버리스에서는 module.exports로 진입)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Vercel 서버리스 함수 진입점
module.exports = app;
