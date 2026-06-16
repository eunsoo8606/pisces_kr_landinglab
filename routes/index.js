const express = require('express');
const router = express.Router();

// 1. 메인 페이지
router.get('/', (req, res) => {
    res.render('index', {
        title: '물고기자리 - 프리미엄 숙성회',
        branding: 'PISCES since 2002',
        metaDescription: '칼 없는 주방, 주방장 없는 횟집! 물고기자리에서 성공적인 프리미엄 숙성회 프랜차이즈 창업을 시작하세요. 20여 년의 노하우로 최상급 활선어 숙성회를 무한리필로 제공합니다.',
        metaKeywords: '물고기자리, 숙성회, 무한리필, 활어회, 프랜차이즈, 창업, 횟집, 소자본창업, 일식창업'
    });
});

// 2. 메뉴 소개 라우트
router.get(['/menu', '/menu/:category'], (req, res) => {
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
    
    res.render('menu', {
        title: '메뉴소개 | 물고기자리 - 프리미엄 숙성회',
        branding: 'PISCES since 2002',
        activeTab: activeTab,
        metaDescription: '물고기자리의 대표 메뉴를 소개합니다. 엄선된 최고급 원어로 오랜 시간 정성껏 빚어내는 프리미엄 숙성회 모듬부터 다채로운 사이드 메뉴까지 경험해 보세요.',
        metaKeywords: '물고기자리 메뉴, 숙성회 코스, 모듬회, 매운탕, 초밥, 횟집 메뉴, 모듬숙성회'
    });
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

// 5. 커뮤니티 라우트
router.get(['/community', '/community/:category'], (req, res) => {
    const categoryParam = req.params.category || 'notice';
    
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

module.exports = router;
