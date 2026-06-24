const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/database');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET || 'pisces_jwt_secret_key_2026_!@#';

// 로그인 시도 무차별 대입(Brute Force) 방지용 Rate Limiter 정의
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 동일 IP당 15분간 최대 5회 로그인 시도 제한
    handler: (req, res) => {
        console.warn(`⚠️ Login rate limit exceeded for IP: ${req.ip || req.headers['x-forwarded-for']}`);
        return res.status(429).send(
            "<script>alert('단시간에 너무 많은 로그인 시도가 발생했습니다. 잠시 후(15분 뒤) 다시 시도해 주세요.'); history.back();</script>"
        );
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// JWT 검증 미들웨어 함수
function checkAuth(req, res, next) {
    const token = req.cookies.admin_token;

    if (!token) {
        return res.send("<script>alert('로그인이 필요한 관리자 전용 페이지입니다.'); location.href='/console/login';</script>");
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.adminUser = decoded; // 요청 객체에 디코딩된 유저 정보 장착
        res.locals.adminUser = decoded; // EJS 뷰 렌더링 시에도 꺼내 쓸 수 있도록 로컬스 변수에 바인딩
        next();
    } catch (err) {
        console.error('⚠️ JWT verification failed:', err.message);
        res.clearCookie('admin_token');
        return res.send("<script>alert('로그인 세션이 만료되었습니다. 다시 로그인 해주세요.'); location.href='/console/login';</script>");
    }
}

// 0. 관리자 루트 접근 시 분기 처리
router.get('/console', (req, res) => {
    const token = req.cookies.admin_token;
    
    if (token) {
        try {
            jwt.verify(token, JWT_SECRET);
            return res.redirect('/console/dashboard');
        } catch (err) {
            res.clearCookie('admin_token');
        }
    }
    res.redirect('/console/login');
});

// 1. 관리자 로그인 뷰 렌더링
router.get('/console/login', (req, res) => {
    const token = req.cookies.admin_token;
    
    // 이미 유효한 토큰 쿠키가 존재한다면 바로 대시보드로 자동 리다이렉트
    if (token) {
        try {
            jwt.verify(token, JWT_SECRET);
            return res.redirect('/console/dashboard');
        } catch (err) {
            res.clearCookie('admin_token');
        }
    }
    
    res.render('console/login');
});

// 2. 관리자 로그인 인증 처리 (JWT 쿠키 발행)
router.post('/console/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send("<script>alert('아이디와 비밀번호를 모두 입력해 주세요.'); history.back();</script>");
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);

        if (users.length === 0) {
            return res.send("<script>alert('아이디 또는 비밀번호가 일치하지 않습니다.'); history.back();</script>");
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.send("<script>alert('아이디 또는 비밀번호가 일치하지 않습니다.'); history.back();</script>");
        }

        // JWT 토큰 발행 (2시간 만료)
        const token = jwt.sign(
            { id: user.id, username: user.username, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        // HttpOnly 속성을 켜서 XSS 공격으로부터 토큰을 원천 방어 (Vercel/HTTPS 환경 대응)
        res.cookie('admin_token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 2, // 2시간
            secure: process.env.NODE_ENV === 'production', // Vercel 상용 환경에서만 https 적용
            sameSite: 'lax'
        });

        return res.redirect('/console/dashboard');

    } catch (err) {
        console.error('❌ Admin Login error (JWT):', err);
        return res.send("<script>alert('서버 내부 오류로 인해 로그인에 실패하였습니다.'); history.back();</script>");
    }
});

// 3. 로그아웃 처리 (쿠키 파기)
router.get('/console/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.redirect('/console/login');
});

// 4. 고도화된 관리자 대시보드 (통계 및 실시간 데이터 바인딩)
router.get('/console/dashboard', checkAuth, async (req, res) => {
    try {
        // 병렬 쿼리 실행
        const [
            [todayVisitorsResult],
            [totalVisitorsResult],
            [todayInquiriesResult],
            [totalInquiriesResult],
            [recentLogs],
            [dailyStats],
            [monthlyStats],
            [deviceStats],
            [hourlyStats],
            [refererStats]
        ] = await Promise.all([
            db.query('SELECT COUNT(*) AS count FROM visitor_logs WHERE DATE(created_at) = CURDATE()'),
            db.query('SELECT COUNT(*) AS count FROM visitor_logs'),
            db.query('SELECT COUNT(*) AS count FROM inquiries WHERE DATE(created_at) = CURDATE()'),
            db.query('SELECT COUNT(*) AS count FROM inquiries'),
            db.query('SELECT ip_address, country, country_code, device_type, os_name, browser_name, referer, requested_url, created_at FROM visitor_logs ORDER BY created_at DESC LIMIT 5'),
            db.query(`
                SELECT DATE_FORMAT(created_at, '%m-%d') AS label, COUNT(*) AS count 
                FROM visitor_logs 
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE_FORMAT(created_at, '%m-%d')
                ORDER BY label ASC
            `),
            db.query(`
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS label, COUNT(*) AS count 
                FROM visitor_logs 
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY label ASC
            `),
            db.query(`
                SELECT COALESCE(device_type, 'PC') AS label, COUNT(*) AS count 
                FROM visitor_logs 
                GROUP BY device_type
            `),
            db.query(`
                SELECT HOUR(created_at) AS label, COUNT(*) AS count 
                FROM visitor_logs 
                GROUP BY HOUR(created_at)
                ORDER BY label ASC
            `),
            db.query(`
                SELECT referer AS label, COUNT(*) AS count 
                FROM visitor_logs 
                WHERE referer IS NOT NULL AND referer != '' AND referer NOT LIKE '%localhost%' AND referer NOT LIKE '%127.0.0.1%'
                GROUP BY referer 
                ORDER BY count DESC 
                LIMIT 5
            `)
        ]);

        const stats = {
            todayVisitors: todayVisitorsResult[0]?.count || 0,
            totalVisitors: totalVisitorsResult[0]?.count || 0,
            todayInquiries: todayInquiriesResult[0]?.count || 0,
            totalInquiries: totalInquiriesResult[0]?.count || 0
        };

        res.render('console/dashboard', {
            title: '물고기자리 관리자 콘솔',
            stats,
            visitorLogs: recentLogs,
            activeMenu: 'dashboard',
            analytics: {
                daily: dailyStats,
                monthly: monthlyStats,
                device: deviceStats,
                hourly: hourlyStats,
                referer: refererStats
            }
        });
    } catch (err) {
        console.error('❌ Failed to load admin dashboard stats:', err);
        res.status(500).send('<h1>서버 통계 데이터 로드에 실패했습니다. DB 환경설정을 확인해 주세요.</h1>');
    }
});

module.exports = {
    router,
    checkAuth
};
