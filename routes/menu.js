// 관리자용 메뉴 관리 라우터 및 CRUD API
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { checkAuth } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 저장 디렉토리 존재 확인 및 생성 (public/images/foods)
const uploadDir = path.join(__dirname, '../public/images/foods');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 스토리지 구성
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 한글 파일명 깨짐 방지 및 고유성 확보를 위해 타임스탬프 + 난수 조합
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
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

// 기존 업로드된 이미지 파일 삭제 헬퍼 함수
const deleteOldImageFile = (imageUrl) => {
    if (!imageUrl) return;
    // 시드 이미지(예: '물고기자리 연출컷-1.jpg', '초밥.jpg' 등)는 삭제하지 않고,
    // multer로 업로드한 타임스탬프 조합 파일명(예: 1718273948291-382918392.jpg)만 타겟팅하여 삭제합니다.
    const isUploadFile = /\/\d+-\d+\.[a-zA-Z0-9]+$/.test(imageUrl);
    if (isUploadFile) {
        const filePath = path.join(__dirname, '../public', imageUrl);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('❌ Failed to delete old image file:', filePath, err.message);
            } else {
                console.log('✅ Deleted old image file:', filePath);
            }
        });
    }
};

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

// 4. 메뉴 생성 API (POST /api/menu - multipart 대응)
router.post('/api/menu', checkAuth, upload.single('image_file'), async (req, res) => {
    const { category, badge, name, price, is_main, sort_order } = req.body;
    
    // 신규 등록 시에는 파일 첨부 필수
    if (!req.file) {
        return res.status(400).json({ success: false, message: '메뉴 이미지 파일을 업로드해 주세요.' });
    }
    
    const image_url = `/images/foods/${req.file.filename}`;
    
    if (!category || !name || !price) {
        deleteOldImageFile(image_url);
        return res.status(400).json({ success: false, message: '카테고리, 메뉴명, 가격은 필수 입력 항목입니다.' });
    }
    
    try {
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
        if (req.file) {
            deleteOldImageFile(`/images/foods/${req.file.filename}`);
        }
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

// 5. 메뉴 수정 API (PUT /api/menu/:id - multipart 대응)
router.put('/api/menu/:id', checkAuth, upload.single('image_file'), async (req, res) => {
    const id = req.params.id;
    const { category, badge, name, price, is_main, sort_order } = req.body;
    let image_url = req.body.image_url || '';

    // 기존 메뉴 정보 조회 (이미지 삭제 및 유효성용)
    let oldImageUrl = '';
    try {
        const [rows] = await db.query('SELECT image_url FROM menus WHERE id = ? LIMIT 1', [id]);
        if (rows.length > 0) {
            oldImageUrl = rows[0].image_url;
        } else {
            if (req.file) deleteOldImageFile(`/images/foods/${req.file.filename}`);
            return res.status(404).json({ success: false, message: '수정할 메뉴를 찾을 수 없습니다.' });
        }
    } catch (dbErr) {
        if (req.file) deleteOldImageFile(`/images/foods/${req.file.filename}`);
        return res.status(500).json({ success: false, message: '서버 DB 에러로 수정 전 조회를 실패했습니다.' });
    }

    // 파일 새로 첨부한 경우 기존 텍스트 경로 덮어쓰기
    if (req.file) {
        image_url = `/images/foods/${req.file.filename}`;
    } else if (!image_url) {
        // 파일도 없고 텍스트 경로도 없다면 기존 경로를 유지
        image_url = oldImageUrl;
    }
    
    if (!category || !name || !price || !image_url) {
        if (req.file) deleteOldImageFile(`/images/foods/${req.file.filename}`);
        return res.status(400).json({ success: false, message: '카테고리, 메뉴명, 가격, 이미지는 필수 입력 항목입니다.' });
    }
    
    try {
        const mainCard = is_main === 1 || is_main === '1' || is_main === 'true' ? 1 : 0;
        const orderVal = parseInt(sort_order, 10) || 0;
        
        const [result] = await db.query(
            `UPDATE menus 
             SET category = ?, badge = ?, name = ?, price = ?, image_url = ?, is_main = ?, sort_order = ?
             WHERE id = ?`,
            [category, badge || null, name, price, image_url, mainCard, orderVal, id]
        );
        
        if (result.affectedRows === 0) {
            if (req.file) deleteOldImageFile(`/images/foods/${req.file.filename}`);
            return res.status(404).json({ success: false, message: '수정할 메뉴를 찾을 수 없습니다.' });
        }

        // 이미지 파일이 성공적으로 교체되었고, 기존 이미지가 사용자 업로드 파일인 경우에만 이전 물리 파일 삭제
        if (req.file && oldImageUrl && oldImageUrl !== image_url) {
            deleteOldImageFile(oldImageUrl);
        }
        
        res.json({ success: true, message: '메뉴가 성공적으로 수정되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to update menu:', err);
        if (req.file) deleteOldImageFile(`/images/foods/${req.file.filename}`);
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

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
