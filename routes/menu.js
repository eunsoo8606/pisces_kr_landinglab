// 관리자용 메뉴 관리 라우터 및 CRUD API
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { checkAuth } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { put, del } = require('@vercel/blob');

// Vercel Serverless 호환을 위한 Multer 메모리 스토리지 구성
const storage = multer.memoryStorage();

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('이미지 파일만 업로드할 수 있습니다.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
});

// Vercel Blob 및 로컬 하이브리드 파일 업로드 헬퍼 함수
async function saveUploadedFile(file, folderName = 'foods') {
    if (!file) return '';

    // 1. Vercel Blob Token이 환경변수에 지정되어 있는 경우 -> Vercel Blob 영구 고속 CDN 저장
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const ext = path.extname(file.originalname) || '.jpg';
            const blobPath = `${folderName}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            const blob = await put(blobPath, file.buffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN
            });
            console.log('✅ Successfully uploaded image to Vercel Blob:', blob.url);
            return blob.url;
        } catch (blobErr) {
            console.error('❌ Vercel Blob upload failed, fallbacking:', blobErr);
        }
    }

    // 2. Token이 없거나 로컬 개발인 경우 Fallback
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const localDir = path.join(__dirname, `../public/images/${folderName}`);
    if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = path.join(localDir, filename);
    fs.writeFileSync(localPath, file.buffer);
    return `/images/${folderName}/${filename}`;
}

// 기존 업로드된 이미지 파일 삭제 헬퍼 함수 (Vercel Blob / 로컬 경로 자동 지원)
async function deleteOldImageFile(imageUrl) {
    if (!imageUrl) return;

    // Vercel Blob 스토리지 파일인 경우
    if (imageUrl.includes('vercel-storage.com')) {
        try {
            await del(imageUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
            console.log('✅ Deleted file from Vercel Blob:', imageUrl);
        } catch (err) {
            console.error('❌ Failed to delete file from Vercel Blob:', err.message);
        }
        return;
    }

    // 로컬 디스크 파일인 경우
    const isUploadFile = /\/\d+-\d+\.[a-zA-Z0-9]+$/.test(imageUrl);
    if (isUploadFile) {
        const filePath = path.join(__dirname, '../public', imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('❌ Failed to delete old local image file:', filePath, err.message);
            });
        }
    }
}

// 카테고리 매핑 한글 라벨
const categoryLabels = {
    'recommended': '추천메뉴',
    'sashimi': '숙성회',
    'special': '특선메뉴',
    'side': '사이드',
    'lunch': '점심특선',
    'set': '세트메뉴'
};

// 1. 관리자 메뉴 목록 조회
router.get('/console/menu', checkAuth, async (req, res) => {
    const categoryFilter = req.query.category || '';
    const searchVal = req.query.search || '';
    
    try {
        let listQuery = 'SELECT * FROM menus';
        let queryParams = [];
        let whereClauses = [];
        
        if (categoryFilter) {
            whereClauses.push('category = ?');
            queryParams.push(categoryFilter);
        }
        
        if (searchVal) {
            whereClauses.push('name LIKE ?');
            queryParams.push(`%${searchVal}%`);
        }
        
        if (whereClauses.length > 0) {
            listQuery += ' WHERE ' + whereClauses.join(' AND ');
        }
        
        listQuery += ' ORDER BY category ASC, sort_order ASC, id ASC';
        
        const [listResult] = await db.query(listQuery, queryParams);
        
        res.render('console/menu_list', {
            title: '물고기자리 관리자 콘솔 - 메뉴(음식) 관리',
            adminUser: req.adminUser,
            list: listResult,
            categoryFilter,
            searchVal,
            categoryLabels,
            activeMenu: 'menu'
        });
    } catch (err) {
        console.error('❌ Failed to load admin menu list:', err);
        res.status(500).send('<h1>메뉴 목록 로드 중 서버 에러가 발생했습니다.</h1>');
    }
});

// 2. 관리자 메뉴 등록 폼
router.get('/console/menu/write', checkAuth, (req, res) => {
    res.render('console/menu_form', {
        title: '물고기자리 관리자 콘솔 - 메뉴 등록',
        adminUser: req.adminUser,
        action: 'write',
        menuItem: null,
        categoryLabels,
        activeMenu: 'menu'
    });
});

// 3. 관리자 메뉴 수정 폼
router.get('/console/menu/edit/:id', checkAuth, async (req, res) => {
    const id = req.params.id;
    
    try {
        const [rows] = await db.query('SELECT * FROM menus WHERE id = ? LIMIT 1', [id]);
        if (rows.length === 0) {
            return res.send("<script>alert('해당 메뉴를 찾을 수 없습니다.'); location.href='/console/menu';</script>");
        }
        
        res.render('console/menu_form', {
            title: '물고기자리 관리자 콘솔 - 메뉴 수정',
            adminUser: req.adminUser,
            action: 'edit',
            menuItem: rows[0],
            categoryLabels,
            activeMenu: 'menu'
        });
    } catch (err) {
        console.error('❌ Failed to load menu edit form:', err);
        res.status(500).send('<h1>메뉴 상세 데이터 조회 중 오류가 발생했습니다.</h1>');
    }
});

// 4. 메뉴 생성 API (POST /api/menu - Vercel Blob 연동)
router.post('/api/menu', checkAuth, upload.single('image_file'), async (req, res) => {
    const { category, badge, name, price, is_main, sort_order } = req.body;
    
    // 신규 등록 시에는 파일 첨부 필수
    if (!req.file) {
        return res.status(400).json({ success: false, message: '메뉴 이미지 파일을 업로드해 주세요.' });
    }
    
    if (!category || !name || !price) {
        return res.status(400).json({ success: false, message: '카테고리, 메뉴명, 가격은 필수 입력 항목입니다.' });
    }
    
    try {
        const image_url = await saveUploadedFile(req.file, 'foods');
        const mainCard = is_main === 1 || is_main === '1' || is_main === 'true' ? 1 : 0;
        const orderVal = parseInt(sort_order, 10) || 0;
        
        await db.query(
            `INSERT INTO menus (category, badge, name, price, image_url, is_main, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [category, badge || null, name, price, image_url, mainCard, orderVal]
        );
        
        res.json({ success: true, message: '성공적으로 등록되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to insert menu:', err);
        res.status(500).json({ success: false, message: 'DB 등록 에러: ' + (err.message || '서버 내부 DB 에러') });
    }
});

// 5. 메뉴 수정 공통 처리 함수 (Vercel Blob 지원)
const handleUpdateMenu = async (req, res) => {
    const id = req.params.id;
    const { category, badge, name, price, is_main, sort_order } = req.body;
    let image_url = req.body.image_url || '';

    // 기존 메뉴 정보 조회
    let oldImageUrl = '';
    try {
        const [rows] = await db.query('SELECT image_url FROM menus WHERE id = ? LIMIT 1', [id]);
        if (rows.length > 0) {
            oldImageUrl = rows[0].image_url;
        } else {
            return res.status(404).json({ success: false, message: '수정할 메뉴를 찾을 수 없습니다. (ID: ' + id + ')' });
        }
    } catch (dbErr) {
        console.error('❌ DB Error during pre-update menu check:', dbErr);
        return res.status(500).json({ success: false, message: 'DB 조회 에러: ' + (dbErr.message || '데이터베이스 오류') });
    }

    // 파일 새로 첨부한 경우 Vercel Blob / 로컬 스토리지 업로드
    if (req.file) {
        image_url = await saveUploadedFile(req.file, 'foods');
    } else if (!image_url) {
        image_url = oldImageUrl;
    }
    
    if (!category || !name || !price || !image_url) {
        return res.status(400).json({ success: false, message: '카테고리, 메뉴명, 가격, 이미지는 필수 입력 항목입니다.' });
    }
    
    try {
        const mainCard = (is_main === 1 || is_main === '1' || is_main === 'true' || is_main === true) ? 1 : 0;
        const orderVal = parseInt(sort_order, 10) || 0;
        
        const [result] = await db.query(
            `UPDATE menus 
             SET category = ?, badge = ?, name = ?, price = ?, image_url = ?, is_main = ?, sort_order = ?
             WHERE id = ?`,
            [category, badge || null, name, price, image_url, mainCard, orderVal, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '수정할 메뉴를 찾을 수 없습니다.' });
        }

        // 이미지 파일이 새 파일로 변경된 경우 기존 파일 삭제
        if (req.file && oldImageUrl && oldImageUrl !== image_url) {
            await deleteOldImageFile(oldImageUrl);
        }
        
        res.json({ success: true, message: '메뉴가 성공적으로 수정되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to update menu in DB:', err);
        res.status(500).json({ success: false, message: 'DB 수정 에러: ' + (err.message || '서버 내부 DB 에러') });
    }
};

// PUT /api/menu/:id 및 POST /api/menu/:id 두 요청 방식 모두 바인딩
router.put('/api/menu/:id', checkAuth, upload.single('image_file'), handleUpdateMenu);
router.post('/api/menu/:id', checkAuth, upload.single('image_file'), handleUpdateMenu);

// 6. 메뉴 삭제 API (DELETE /api/menu/:id)
router.delete('/api/menu/:id', checkAuth, async (req, res) => {
    const id = req.params.id;
    
    try {
        // 기존 이미지 url 먼저 조회
        const [rows] = await db.query('SELECT image_url FROM menus WHERE id = ? LIMIT 1', [id]);
        let oldImageUrl = '';
        if (rows.length > 0) {
            oldImageUrl = rows[0].image_url;
        }

        const [result] = await db.query('DELETE FROM menus WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '삭제할 메뉴를 찾을 수 없습니다.' });
        }
        
        // 삭제 성공 시 업로드 이미지일 경우 물리 파일도 영구 삭제
        if (oldImageUrl) {
            deleteOldImageFile(oldImageUrl);
        }

        res.json({ success: true, message: '성공적으로 삭제되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to delete menu:', err);
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

module.exports = router;
