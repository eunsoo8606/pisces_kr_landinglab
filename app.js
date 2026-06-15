const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// EJS 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 미드웨어
app.use(express.static(path.join(__dirname, 'public')));

// 모든 템플릿에 baseUrl 주입 (카카오톡 등 OG 크롤러가 절대 경로를 요구하기 때문)
app.use((req, res, next) => {
    res.locals.baseUrl = `${req.protocol}://${req.get('host')}`;
    next();
});

// 기본 라우트
app.get('/', (req, res) => {
    res.render('index', {
        title: '물고기자리 - 프리미엄 숙성회',
        branding: 'PISCES since 2002'
    });
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
        activeTab: activeTab
    });
});

// 가맹 관련 라우트 리다이렉션 (홈의 창업 상담 섹션으로 이동)
app.use('/franchise', (req, res) => {
    res.redirect('/#franchise');
});

// 회사소개 라우트
app.get('/brand/about', (req, res) => {
    res.render('brand/about', {
        title: '브랜드스토리 | 물고기자리 - 프리미엄 숙성회',
        branding: 'PISCES since 2002'
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
        activeTab: activeTab
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
