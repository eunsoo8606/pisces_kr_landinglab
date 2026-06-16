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
        branding: 'PISCES since 2002',
        metaDescription: '칼 없는 주방, 주방장 없는 횟집! 물고기자리에서 성공적인 프리미엄 숙성회 프랜차이즈 창업을 시작하세요. 20여 년의 노하우로 최상급 활선어 숙성회를 무한리필로 제공합니다.',
        metaKeywords: '물고기자리, 숙성회, 무한리필, 활어회, 프랜차이즈, 창업, 횟집, 소자본창업, 일식창업'
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
