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

        // DB에서 메뉴 데이터 조회
        const [menuList] = await db.query('SELECT * FROM menus ORDER BY sort_order ASC, id ASC');

        res.render('index', {
            title: '물고기자리 - 프리미엄 숙성회',
            branding: 'PISCES since 2002',
            metaDescription: '칼 없는 주방, 주방장 없는 횟집! 물고기자리에서 성공적인 프리미엄 숙성회 프랜차이즈 창업을 시작하세요. 20여 년 of 노하우로 최상급 활선어 숙성회를 무한리필로 제공합니다.',
            metaKeywords: '물고기자리, 숙성회, 무한리필, 활어회, 프랜차이즈, 창업, 횟집, 소자본창업, 일식창업',
            popups: popups,
            menuList: menuList || []
        });
    } catch (err) {
        console.error('❌ Failed to fetch active popups or menus for landing page:', err);
        res.render('index', {
            title: '물고기자리 - 프리미엄 숙성회',
            branding: 'PISCES since 2002',
            metaDescription: '칼 없는 주방, 주방장 없는 횟집! 물고기자리에서 성공적인 프리미엄 숙성회 프랜차이즈 창업을 시작하세요. 20여 년 of 노하우로 최상급 활선어 숙성회를 무한리필로 제공합니다.',
            metaKeywords: '물고기자리, 숙성회, 무한리필, 활어회, 프랜차이즈, 창업, 횟집, 소자본창업, 일식창업',
            popups: [],
            menuList: []
        });
    }
});

// 2. 메뉴 소개 라우트
router.get(['/menu', '/menu/:category'], async (req, res) => {
    const categoryParam = req.params.category || 'recommend';
    
    const categoryMap = {
        'main': 'main',
        'course': 'main',
        'recommend': 'main',
        'recommended': 'main',
        'sashimi': 'main',
        'side': 'side',
        'sake': 'sake'
    };
    
    const activeTab = categoryMap[categoryParam] || 'main';
    
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

// 3. 가맹점 현황 라우트 (DB 동적 연동)
router.get(['/stores', '/brand/stores'], async (req, res) => {
    try {
        let stores = [];
        try {
            const [rows] = await db.query("SELECT name, address, phone, lat, lng FROM stores WHERE use_yn = 'Y' ORDER BY id ASC");
            // lat, lng 숫자로 파싱
            stores = rows.map(s => ({
                ...s,
                lat: parseFloat(s.lat),
                lng: parseFloat(s.lng)
            }));
        } catch (dbErr) {
            console.error('⚠️ DB store query fallback:', dbErr.message);
        }

        // DB 조회가 비어있을 경우 예비 샘플
        if (stores.length === 0) {
            stores = [
                { name: '물고기자리 본점 (정자점)', address: '경기도 성남시 분당구 성남대로331번길 3-3', phone: '031-711-2234', lat: 37.361543, lng: 127.110292 },
                { name: '물고기자리 강남역점', address: '서울특별시 강남구 테헤란로4길 46', phone: '02-556-3345', lat: 37.496521, lng: 127.030588 },
                { name: '물고기자리 수원망포점', address: '경기도 수원시 영통구 영통로 130-1', phone: '031-205-4456', lat: 37.243588, lng: 127.058334 },
                { name: '물고기자리 인천송도점', address: '인천광역시 연수구 컨벤시아대로 80', phone: '032-831-5567', lat: 37.393452, lng: 126.652311 },
                { name: '물고기자리 일산대화점', address: '경기도 고양시 일산서구 대화로 123', phone: '031-921-6678', lat: 37.675688, lng: 126.748332 }
            ];
        }

        res.render('stores/index', {
            title: '가맹점 현황 | 물고기자리 - 프리미엄 숙성회',
            branding: 'PISCES since 2002',
            storesData: stores,
            kakaoKey: process.env.KAKAO_MAP_JAVASCRIPT_KEY || '',
            metaDescription: '물고기자리의 가맹점 현황을 소개합니다. 가까운 매장을 찾아 특별한 숙성회 맛을 경험해 보세요.',
            metaKeywords: '물고기자리 매장, 가맹점 찾기, 물고기자리 지점, 숙성회 매장'
        });
    } catch (err) {
        console.error('❌ Error rendering stores page:', err);
        res.status(500).send('가맹점 현황 페이지 로딩 중 오류가 발생했습니다.');
    }
});

// 4. 가맹 관련 라우트 리다이렉션
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

// 4-2. 오시는길 라우트
router.get('/brand/location', (req, res) => {
    res.render('brand/location', {
        title: '오시는길 | 물고기자리 - 프리미엄 숙성회',
        branding: 'PISCES since 2002',
        kakaoKey: process.env.KAKAO_MAP_JAVASCRIPT_KEY || '',
        metaDescription: '물고기자리 본사 오시는 길을 안내해 드립니다. 경기도 용인시 기흥구 보정동 풍산프라자 703호에서 성공적인 프랜차이즈 상담을 시작해 보세요.',
        metaKeywords: '물고기자리 본사, 물고기자리 오시는길, 보정동 물고기자리, 풍산프라자'
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
router.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const urls = [
            { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
            { loc: `${baseUrl}/brand/about`, changefreq: 'weekly', priority: '0.8' },
            { loc: `${baseUrl}/menu`, changefreq: 'weekly', priority: '0.8' },
            { loc: `${baseUrl}/menu/main`, changefreq: 'weekly', priority: '0.8' },
            { loc: `${baseUrl}/menu/side`, changefreq: 'weekly', priority: '0.8' },
            { loc: `${baseUrl}/menu/sake`, changefreq: 'weekly', priority: '0.8' },
            { loc: `${baseUrl}/stores`, changefreq: 'daily', priority: '0.9' },
            { loc: `${baseUrl}/community`, changefreq: 'daily', priority: '0.8' },
            { loc: `${baseUrl}/community/notice`, changefreq: 'daily', priority: '0.8' },
            { loc: `${baseUrl}/community/faq`, changefreq: 'weekly', priority: '0.7' },
            { loc: `${baseUrl}/community/voice`, changefreq: 'daily', priority: '0.7' },
            { loc: `${baseUrl}/community/inquiry`, changefreq: 'daily', priority: '0.7' }
        ];

        // DB에서 최신 게시글 가져와 sitemap 추가
        try {
            const [posts] = await db.query('SELECT id, category, updated_at FROM boards ORDER BY id DESC LIMIT 50');
            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                    urls.push({
                        loc: `${baseUrl}/community/${post.category}`,
                        lastmod: lastmod,
                        changefreq: 'weekly',
                        priority: '0.6'
                    });
                });
            }
        } catch (dbErr) {
            console.error('⚠️ DB post query for sitemap failed:', dbErr);
        }

        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        urls.forEach(url => {
            xml += '<url>';
            xml += `<loc>${url.loc}</loc>`;
            if (url.lastmod) xml += `<lastmod>${url.lastmod}</lastmod>`;
            xml += `<changefreq>${url.changefreq}</changefreq>`;
            xml += `<priority>${url.priority}</priority>`;
            xml += '</url>';
        });
        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error('❌ Failed to generate sitemap.xml:', err);
        res.status(500).send('Sitemap Generation Error');
    }
});

// 7. RSS 2.0 피드 동적 생성 라우트 (/rss.xml 및 /rss)
router.get(['/rss.xml', '/rss'], async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const siteTitle = '물고기자리 - 프리미엄 숙성회 전문 프랜차이즈';
        const siteDescription = '전문 조리사 필요 없는 쉽고 완벽한 주방 시스템. 물고기자리에서 성공적인 프리미엄 숙성회 창업을 시작하세요.';

        let itemsXml = '';
        try {
            const [posts] = await db.query('SELECT * FROM boards ORDER BY id DESC LIMIT 30');
            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    const pubDate = new Date(post.created_at || Date.now()).toUTCString();
                    const postTitle = post.title || '물고기자리 안내소식';
                    const postLink = `${baseUrl}/community/${post.category || 'notice'}`;
                    const rawContent = post.content ? post.content.replace(/<[^>]*>?/gm, '').substring(0, 300) : siteDescription;

                    itemsXml += `
        <item>
            <title><![CDATA[${postTitle}]]></title>
            <link>${postLink}</link>
            <description><![CDATA[${rawContent}]]></description>
            <pubDate>${pubDate}</pubDate>
            <guid>${postLink}#${post.id}</guid>
        </item>`;
                });
            }
        } catch (dbErr) {
            console.error('⚠️ DB fetch for RSS failed:', dbErr);
        }

        const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title><![CDATA[${siteTitle}]]></title>
    <link>${baseUrl}</link>
    <description><![CDATA[${siteDescription}]]></description>
    <language>ko-KR</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
</channel>
</rss>`;

        res.header('Content-Type', 'application/xml');
        res.send(rssXml);
    } catch (err) {
        console.error('❌ Failed to generate rss.xml:', err);
        res.status(500).send('RSS Generation Error');
    }
});

// 8. robots.txt 동적 생성 라우트
router.get('/robots.txt', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let robots = 'User-agent: *\n';
    robots += 'Allow: /\n';
    robots += 'Disallow: /console/\n';
    robots += 'Disallow: /api/\n\n';
    robots += `Sitemap: ${baseUrl}/sitemap.xml\n`;
    robots += `Sitemap: ${baseUrl}/rss.xml\n`;
    
    res.header('Content-Type', 'text/plain');
    res.send(robots);
});

module.exports = router;
