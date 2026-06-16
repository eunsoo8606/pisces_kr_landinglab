// 환경변수(.env) 로드
require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// DB 연결 풀 및 이메일 유틸 임포트
const db = require('./db/database');
const { sendConsultationNotification } = require('./utils/email');

// EJS 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 미들웨어
app.use(express.static(path.join(__dirname, 'public')));

// 요청 본문 파서 미들웨어 (일반 폼 전송 및 JSON Ajax 전송 대응)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

// 기본 라우트
app.get('/', (req, res) => {
    res.render('index', {
        title: '물고기자리 - 프리미엄 숙성회',
        branding: 'PISCES since 2002',
        metaDescription: '칼 없는 주방, 주방장 없는 횟집! 물고기자리에서 성공적인 프리미엄 숙성회 프랜차이즈 창업을 시작하세요. 20여 년의 노하우로 최상급 활선어 숙성회를 무한리필로 제공합니다.',
        metaKeywords: '물고기자리, 숙성회, 무한리필, 활어회, 프랜차이즈, 창업, 횟집, 소자본창업, 일식창업'
    });
});

// 창업 문의/상담 신청 접수 라우터
app.post('/inquire', async (req, res) => {
    try {
        const isJson = req.headers['content-type'] && req.headers['content-type'].includes('json');

        // 필드 파싱 (일반 Form Submit 데이터 및 JSON Ajax 데이터 모두 대응)
        const name = req.body.name || req.body.inquirerName;
        const phone = req.body.phone || req.body.inquirerPhone;
        const email = req.body.email || '';
        const region = req.body.region || '';
        const message = req.body.message || '';

        // 유효성 체크
        if (!name || !phone) {
            if (isJson) {
                return res.status(400).json({ success: false, message: '성함과 연락처는 필수 항목입니다.' });
            } else {
                return res.send("<script>alert('성함과 연락처는 필수 입력 항목입니다.'); history.back();</script>");
            }
        }

        // 1. DB 저장
        await db.query(
            `INSERT INTO inquiries (name, phone, email, region, message, status) 
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [name, phone, email, region, message]
        );

        // 2. 관리자 메일 알림 전송 (메일 전송 실패 시에도 접수는 완료되도록 처리)
        try {
            await sendConsultationNotification({
                name,
                phone,
                email,
                region,
                message
            });
        } catch (mailErr) {
            console.error('⚠️ Mail send error:', mailErr);
        }

        if (isJson) {
            return res.json({ success: true, message: '창업 상담 신청이 접수되었습니다.' });
        } else {
            return res.send("<script>alert('성공적으로 창업 상담 신청이 접수되었습니다.'); location.href='/';</script>");
        }
    } catch (err) {
        console.error('❌ Error saving inquiry:', err);
        if (req.headers['content-type'] && req.headers['content-type'].includes('json')) {
            return res.status(500).json({ success: false, message: '서버 오류로 인해 접수에 실패하였습니다.' });
        } else {
            return res.send("<script>alert('서버 오류로 접수 중 에러가 발생하였습니다. 잠시 후 다시 시도해 주세요.'); history.back();</script>");
        }
    }
});

// 메뉴 소개 라우트
app.get(['/menu', '/menu/:category'], (req, res) => {
    const categoryParam = req.params.category || 'recommend';
    
    // URL 카테고리 명칭과 내부 탭 식별값 매핑
    const categoryMap = {
        'recommend': 'recommended',
        'sashimi': 'sashimi',
        'special': 'special',
        'side': 'side',
        'lunch': 'lunch',
        'set': 'set'
    };
    
    const activeTab = categoryMap[categoryParam] || 'recommended';
    
    res.render('menu', {
        title: '메뉴소개 | 물고기자리 - 프리미엄 숙성회',
        branding: 'PISCES since 2002',
        activeTab: activeTab,
        metaDescription: '물고기자리의 대표 메뉴를 소개합니다. 엄선된 최고급 원어로 오랜 시간 정성껏 빚어내는 프리미엄 숙성회 모듬부터 다채로운 사이드 메뉴까지 경험해 보세요.',
        metaKeywords: '물고기자리 메뉴, 숙성회 코스, 모듬회, 매운탕, 초밥, 횟집 메뉴, 모듬숙성회'
    });
});

// 가맹 관련 라우트 리다이렉션 (홈의 창업 상담 섹션으로 이동)
app.use('/franchise', (req, res) => {
    res.redirect('/#franchise');
});

// 브랜드소개 라우트
app.get('/brand/about', (req, res) => {
    res.render('brand/about', {
        title: '브랜드소개 | 물고기자리 - 프리미엄 숙성회',
        branding: 'PISCES since 2002',
        metaDescription: 'since 2002 물고기자리의 철학과 역사. 왜 물고기자리 숙성회인가? 최고의 맛을 향한 타협 없는 고집과 가치를 지켜나가는 브랜드 스토리입니다.',
        metaKeywords: '물고기자리 스토리, 숙성회 철학, 횟집 역사, 브랜드스토리, 물고기자리 브랜드'
    });
});

// 커뮤니티 라우트
app.get(['/community', '/community/:category'], (req, res) => {
    const categoryParam = req.params.category || 'notice';
    
    // URL 카테고리 명칭과 내부 탭 식별값 매핑
    const categoryMap = {
        'notice': 'notice',
        'faq': 'faq',
        'voice': 'voice',
        'inquiry': 'inquiry'
    };
    
    const activeTab = categoryMap[categoryParam] || 'notice';
    
    res.render('community', {
        title: '커뮤니티 | 물고기자리 - 프리미엄 숙성회',
        branding: 'PISCES since 2002',
        activeTab: activeTab,
        metaDescription: '물고기자리 고객 센터 및 소통 공간. 공지사항, 자주 묻는 질문(FAQ) 안내와 함께 서비스 불편사항 접수(고객의 소리), 가맹 및 비즈니스 제휴 문의를 제공합니다.',
        metaKeywords: '물고기자리 고객센터, 가맹문의, 제휴문의, 공지사항, FAQ, 고객의소리, 불편접수'
    });
});

// 로컬 개발 환경에서만 listen (Vercel 서버리스에서는 module.exports로 진입)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Vercel 서버리스 함수 진입점
module.exports = app;
