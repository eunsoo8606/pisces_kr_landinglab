const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 1. 메인 페이지
router.get('/', async (req, res) => {
    try {
        // 현재 날짜 기준으로 노출 대상이 되는 활성 팝업 리스트 조회
        const [popups] = await db.query(
            `SELECT * FROM popups 
             WHERE is_active = 1 
               AND start_date <= NOW() 
               AND end_date >= NOW()`
        );

        res.render('index', {
            title: '물고기자리 - 프리미엄 숙성회',
            branding: 'PISCES since 2002',
            metaDescription: '칼 없는 주방, 주방장 없는 횟집! 물고기자리에서 성공적인 프리미엄 숙성회 프랜차이즈 창업을 시작하세요. 20여 년 of 노하우로 최상급 활선어 숙성회를 무한리필로 제공합니다.',
            metaKeywords: '물고기자리, 숙성회, 무한리필, 활어회, 프랜차이즈, 창업, 횟집, 소자본창업, 일식창업',
            popups: popups
        });
    } catch (err) {
        console.error('❌ Failed to fetch active popups for landing page:', err);
        res.render('index', {
            title: '물고기자리 - 프리미엄 숙성회',
            branding: 'PISCES since 2002',
            metaDescription: '칼 없는 주방, 주방장 없는 횟집! 물고기자리에서 성공적인 프리미엄 숙성회 프랜차이즈 창업을 시작하세요. 20여 년 of 노하우로 최상급 활선어 숙성회를 무한리필로 제공합니다.',
            metaKeywords: '물고기자리, 숙성회, 무한리필, 활어회, 프랜차이즈, 창업, 횟집, 소자본창업, 일식창업',
            popups: []
        });
    }
});

// 2. 메뉴 소개 라우트
router.get(['/menu', '/menu/:category'], async (req, res) => {
    const categoryParam = req.params.category || 'recommend';
    
    const categoryMap = {
        'recommend': 'recommended',
        'sashimi': 'sashimi',
        'special': 'special',
        'side': 'side',
        'lunch': 'lunch',
        'set': 'set'
    };
    
    const activeTab = categoryMap[categoryParam] || 'recommended';
    
    try {
        const [menuList] = await db.query('SELECT * FROM menus ORDER BY sort_order ASC, id ASC');
        
        res.render('menu', {
            title: '메뉴소개 | 물고기자리 - 프리미엄 숙성회',
            branding: 'PISCES since 2002',
            activeTab: activeTab,
            menuList: menuList,
            metaDescription: '물고기자리의 대표 메뉴를 소개합니다. 엄선된 최고급 원어로 오랜 시간 정성껏 빚어내는 프리미엄 숙성회 모듬부터 다채로운 사이드 메뉴까지 경험해 보세요.',
            metaKeywords: '물고기자리 메뉴, 숙성회 코스, 모듬회, 매운탕, 초밥, 횟집 메뉴, 모듬숙성회'
        });
    } catch (err) {
        console.error('❌ Failed to fetch menu list:', err);
        res.status(500).send('<h1>메뉴 데이터를 로드하는 도중 오류가 발생했습니다.</h1>');
    }
});

// 3. 가맹 관련 라우트 리다이렉션
router.use('/franchise', (req, res) => {
    res.redirect('/#franchise');
});

// 4. 브랜드소개 라우트
router.get('/brand/about', (req, res) => {
    res.render('brand/about', {
        title: '브랜드소개 | 물고기자리 - 프리미엄 숙성회',
        branding: 'PISCES since 2002',
        metaDescription: 'since 2002 물고기자리의 철학과 역사. 왜 물고기자리 숙성회인가? 최고의 맛을 향한 타협 없는 고집과 가치를 지켜나가는 브랜드 스토리입니다.',
        metaKeywords: '물고기자리 스토리, 숙성회 철학, 횟집 역사, 브랜드스토리, 물고기자리 브랜드'
    });
});

// 5. 커뮤니티 라우트 (DB 연동)
router.get(['/community', '/community/:category'], async (req, res) => {
    const categoryParam = req.params.category || 'notice';
    
    const categoryMap = {
        'notice': 'notice',
        'faq': 'faq',
        'voice': 'voice',
        'inquiry': 'inquiry'
    };
    
    const activeTab = categoryMap[categoryParam] || 'notice';
    
    try {
        let listQuery = 'SELECT * FROM boards WHERE category = ?';
        if (activeTab === 'notice') {
            listQuery += ' ORDER BY is_pinned DESC, created_at DESC';
        } else if (activeTab === 'faq') {
            listQuery += ' ORDER BY id ASC';
        } else {
            listQuery += ' ORDER BY created_at DESC';
        }

        const [listResult] = await db.query(listQuery, [activeTab]);

        res.render('community', {
            title: '커뮤니티 | 물고기자리 - 프리미엄 숙성회',
            branding: 'PISCES since 2002',
            activeTab: activeTab,
            list: listResult,
            metaDescription: '물고기자리 고객 센터 및 소통 공간. 공지사항, 자주 묻는 질문(FAQ) 안내와 함께 서비스 불편사항 접수(고객의 소리), 가맹 및 비즈니스 제휴 문의를 제공합니다.',
            metaKeywords: '물고기자리 고객센터, 가맹문의, 제휴문의, 공지사항, FAQ, 고객의소리, 불편접수'
        });
    } catch (err) {
        console.error('❌ Failed to fetch community list:', err);
        res.status(500).send('<h1>커뮤니티 데이터를 가져오는 도중 오류가 발생했습니다.</h1>');
    }
});

// 6. sitemap.xml 동적 생성 라우트
router.get('/sitemap.xml', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const urls = [
        { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
        { loc: `${baseUrl}/brand/about`, changefreq: 'weekly', priority: '0.8' },
        { loc: `${baseUrl}/menu`, changefreq: 'weekly', priority: '0.8' },
        { loc: `${baseUrl}/community`, changefreq: 'weekly', priority: '0.8' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    urls.forEach(url => {
        xml += '<url>';
        xml += `<loc>${url.loc}</loc>`;
        xml += `<changefreq>${url.changefreq}</changefreq>`;
        xml += `<priority>${url.priority}</priority>`;
        xml += '</url>';
    });
    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
});

// 7. robots.txt 동적 생성 라우트
router.get('/robots.txt', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let robots = 'User-agent: *\n';
    robots += 'Allow: /\n';
    robots += 'Disallow: /console/\n\n';
    robots += `Sitemap: ${baseUrl}/sitemap.xml\n`;
    
    res.header('Content-Type', 'text/plain');
    res.send(robots);
});

module.exports = router;
