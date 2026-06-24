// 관리자용 팝업 관리 라우터 및 CRUD API
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { checkAuth } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 저장 디렉토리 존재 확인 및 생성 (public/images/popups)
const uploadDir = path.join(__dirname, '../public/images/popups');
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
    const isUploadFile = /\/\d+-\d+\.[a-zA-Z0-9]+$/.test(imageUrl);
    if (isUploadFile) {
        const filePath = path.join(__dirname, '../public', imageUrl);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('❌ Failed to delete old popup image file:', filePath, err.message);
            } else {
                console.log('✅ Deleted old popup image file:', filePath);
            }
        });
    }
};

// 1. 관리자 팝업 목록 조회
router.get('/console/popup', checkAuth, async (req, res) => {
    try {
        const [listResult] = await db.query(
            'SELECT * FROM popups ORDER BY created_at DESC'
        );
        
        res.render('console/popup_list', {
            title: '물고기자리 관리자 콘솔 - 팝업 관리',
            adminUser: req.adminUser,
            list: listResult,
            activeMenu: 'popup'
        });
    } catch (err) {
        console.error('❌ Failed to load admin popup list:', err);
        res.status(500).send('<h1>팝업 목록 로드 중 서버 에러가 발생했습니다.</h1>');
    }
});

// 2. 관리자 팝업 등록 폼
router.get('/console/popup/write', checkAuth, (req, res) => {
    res.render('console/popup_form', {
        title: '물고기자리 관리자 콘솔 - 팝업 등록',
        adminUser: req.adminUser,
        action: 'write',
        popupItem: null,
        activeMenu: 'popup'
    });
});

// 3. 관리자 팝업 수정 폼
router.get('/console/popup/edit/:id', checkAuth, async (req, res) => {
    const id = req.params.id;
    
    try {
        const [rows] = await db.query('SELECT * FROM popups WHERE id = ? LIMIT 1', [id]);
        if (rows.length === 0) {
            return res.send("<script>alert('해당 팝업을 찾을 수 없습니다.'); location.href='/console/popup';</script>");
        }
        
        res.render('console/popup_form', {
            title: '물고기자리 관리자 콘솔 - 팝업 수정',
            adminUser: req.adminUser,
            action: 'edit',
            popupItem: rows[0],
            activeMenu: 'popup'
        });
    } catch (err) {
        console.error('❌ Failed to load popup edit form:', err);
        res.status(500).send('<h1>팝업 상세 데이터 조회 중 오류가 발생했습니다.</h1>');
    }
});

// 4. 팝업 생성 API (POST /api/popup)
router.post('/api/popup', checkAuth, upload.single('image_file'), async (req, res) => {
    const { title, link_url, target, width, height, position_top, position_left, start_date, end_date, is_active } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: '팝업 이미지 파일을 업로드해 주세요.' });
    }
    
    const image_url = `/images/popups/${req.file.filename}`;
    
    if (!title || !start_date || !end_date) {
        deleteOldImageFile(image_url);
        return res.status(400).json({ success: false, message: '팝업 제목, 노출 시작일, 노출 종료일은 필수 입력 항목입니다.' });
    }
    
    try {
        const activeVal = is_active === 1 || is_active === '1' || is_active === 'true' ? 1 : 0;
        const widthVal = parseInt(width, 10) || 400;
        const heightVal = parseInt(height, 10) || 500;
        const topVal = parseInt(position_top, 10) || 50;
        const leftVal = parseInt(position_left, 10) || 50;
        
        await db.query(
            `INSERT INTO popups (title, image_url, link_url, target, width, height, position_top, position_left, start_date, end_date, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, image_url, link_url || null, target || '_self', widthVal, heightVal, topVal, leftVal, start_date, end_date, activeVal]
        );
        
        res.json({ success: true, message: '성공적으로 등록되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to insert popup:', err);
        if (req.file) {
            deleteOldImageFile(`/images/popups/${req.file.filename}`);
        }
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

// 5. 팝업 수정 API (PUT /api/popup/:id)
router.put('/api/popup/:id', checkAuth, upload.single('image_file'), async (req, res) => {
    const id = req.params.id;
    const { title, link_url, target, width, height, position_top, position_left, start_date, end_date, is_active } = req.body;
    let image_url = req.body.image_url || '';

    let oldImageUrl = '';
    try {
        const [rows] = await db.query('SELECT image_url FROM popups WHERE id = ? LIMIT 1', [id]);
        if (rows.length > 0) {
            oldImageUrl = rows[0].image_url;
        } else {
            if (req.file) deleteOldImageFile(`/images/popups/${req.file.filename}`);
            return res.status(404).json({ success: false, message: '수정할 팝업을 찾을 수 없습니다.' });
        }
    } catch (dbErr) {
        if (req.file) deleteOldImageFile(`/images/popups/${req.file.filename}`);
        return res.status(500).json({ success: false, message: '서버 DB 에러로 수정 전 조회를 실패했습니다.' });
    }

    if (req.file) {
        image_url = `/images/popups/${req.file.filename}`;
    } else if (!image_url) {
        image_url = oldImageUrl;
    }
    
    if (!title || !image_url || !start_date || !end_date) {
        if (req.file) deleteOldImageFile(`/images/popups/${req.file.filename}`);
        return res.status(400).json({ success: false, message: '팝업 제목, 이미지, 노출 시작일, 노출 종료일은 필수 입력 항목입니다.' });
    }
    
    try {
        const activeVal = is_active === 1 || is_active === '1' || is_active === 'true' ? 1 : 0;
        const widthVal = parseInt(width, 10) || 400;
        const heightVal = parseInt(height, 10) || 500;
        const topVal = parseInt(position_top, 10) || 50;
        const leftVal = parseInt(position_left, 10) || 50;
        
        const [result] = await db.query(
            `UPDATE popups 
             SET title = ?, image_url = ?, link_url = ?, target = ?, width = ?, height = ?, position_top = ?, position_left = ?, start_date = ?, end_date = ?, is_active = ?
             WHERE id = ?`,
            [title, image_url, link_url || null, target || '_self', widthVal, heightVal, topVal, leftVal, start_date, end_date, activeVal, id]
        );
        
        if (result.affectedRows === 0) {
            if (req.file) deleteOldImageFile(`/images/popups/${req.file.filename}`);
            return res.status(404).json({ success: false, message: '수정할 팝업을 찾을 수 없습니다.' });
        }

        if (req.file && oldImageUrl && oldImageUrl !== image_url) {
            deleteOldImageFile(oldImageUrl);
        }
        
        res.json({ success: true, message: '팝업 정보가 성공적으로 수정되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to update popup:', err);
        if (req.file) deleteOldImageFile(`/images/popups/${req.file.filename}`);
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

// 6. 팝업 활성화 상태 토글 API (PUT /api/popup/toggle/:id)
router.put('/api/popup/toggle/:id', checkAuth, async (req, res) => {
    const id = req.params.id;
    
    try {
        const [result] = await db.query(
            'UPDATE popups SET is_active = NOT is_active WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '상태를 변경할 팝업을 찾을 수 없습니다.' });
        }
        
        const [updated] = await db.query('SELECT is_active FROM popups WHERE id = ? LIMIT 1', [id]);
        res.json({ success: true, is_active: updated[0].is_active, message: '활성화 상태가 정상 변경되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to toggle popup state:', err);
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

// 7. 팝업 삭제 API (DELETE /api/popup/:id)
router.delete('/api/popup/:id', checkAuth, async (req, res) => {
    const id = req.params.id;
    
    try {
        const [rows] = await db.query('SELECT image_url FROM popups WHERE id = ? LIMIT 1', [id]);
        let oldImageUrl = '';
        if (rows.length > 0) {
            oldImageUrl = rows[0].image_url;
        }

        const [result] = await db.query('DELETE FROM popups WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '삭제할 팝업을 찾을 수 없습니다.' });
        }
        
        if (oldImageUrl) {
            deleteOldImageFile(oldImageUrl);
        }

        res.json({ success: true, message: '성공적으로 삭제되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to delete popup:', err);
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

module.exports = router;
