// 관리자용 팝업 관리 라우터 및 CRUD API
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { checkAuth } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { put, del } = require('@vercel/blob');

// Vercel Serverless 대응 메모리 스토리지
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
async function saveUploadedFile(file, folderName = 'popups') {
    if (!file) return '';

    // 1. Vercel Blob Token이 환경변수에 지정되어 있는 경우 -> Vercel Blob 영구 저장
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const ext = path.extname(file.originalname) || '.jpg';
            const blobPath = `${folderName}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            const blob = await put(blobPath, file.buffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN
            });
            console.log('✅ Successfully uploaded popup to Vercel Blob:', blob.url);
            return blob.url;
        } catch (blobErr) {
            console.error('❌ Vercel Blob popup upload failed, fallbacking:', blobErr);
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

// 기존 업로드된 이미지 파일 삭제 헬퍼 함수 (Vercel Blob / 로컬 지원)
async function deleteOldImageFile(imageUrl) {
    if (!imageUrl) return;

    if (imageUrl.includes('vercel-storage.com')) {
        try {
            await del(imageUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
            console.log('✅ Deleted popup file from Vercel Blob:', imageUrl);
        } catch (err) {
            console.error('❌ Failed to delete popup from Vercel Blob:', err.message);
        }
        return;
    }

    const isUploadFile = /\/\d+-\d+\.[a-zA-Z0-9]+$/.test(imageUrl);
    if (isUploadFile) {
        const filePath = path.join(__dirname, '../public', imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('❌ Failed to delete old popup file:', filePath, err.message);
            });
        }
    }
}

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

// 4. 팝업 생성 API (POST /api/popup - Vercel Blob 연동)
router.post('/api/popup', checkAuth, upload.single('image_file'), async (req, res) => {
    const { title, link_url, target, width, height, position_top, position_left, start_date, end_date, is_active } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: '팝업 이미지 파일을 업로드해 주세요.' });
    }
    
    if (!title || !start_date || !end_date) {
        return res.status(400).json({ success: false, message: '팝업 제목, 노출 시작일, 노출 종료일은 필수 입력 항목입니다.' });
    }
    
    try {
        const image_url = await saveUploadedFile(req.file, 'popups');
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
        res.status(500).json({ success: false, message: 'DB 등록 에러: ' + (err.message || '서버 에러') });
    }
});

// 5. 팝업 수정 공통 처리 함수 (Vercel Blob 지원)
const handleUpdatePopup = async (req, res) => {
    const id = req.params.id;
    const { title, link_url, target, width, height, position_top, position_left, start_date, end_date, is_active } = req.body;
    let image_url = req.body.image_url || '';

    let oldImageUrl = '';
    try {
        const [rows] = await db.query('SELECT image_url FROM popups WHERE id = ? LIMIT 1', [id]);
        if (rows.length > 0) {
            oldImageUrl = rows[0].image_url;
        } else {
            return res.status(404).json({ success: false, message: '수정할 팝업을 찾을 수 없습니다.' });
        }
    } catch (dbErr) {
        console.error('❌ DB Error during pre-update popup check:', dbErr);
        return res.status(500).json({ success: false, message: 'DB 조회 에러: ' + (dbErr.message || '데이터베이스 오류') });
    }

    if (req.file) {
        image_url = await saveUploadedFile(req.file, 'popups');
    } else if (!image_url) {
        image_url = oldImageUrl;
    }
    
    if (!title || !image_url || !start_date || !end_date) {
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
            return res.status(404).json({ success: false, message: '수정할 팝업을 찾을 수 없습니다.' });
        }

        if (req.file && oldImageUrl && oldImageUrl !== image_url) {
            await deleteOldImageFile(oldImageUrl);
        }
        
        res.json({ success: true, message: '팝업 정보가 성공적으로 수정되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to update popup:', err);
        res.status(500).json({ success: false, message: 'DB 수정 에러: ' + (err.message || '서버 내부 에러') });
    }
};

router.put('/api/popup/:id', checkAuth, upload.single('image_file'), handleUpdatePopup);
router.post('/api/popup/:id', checkAuth, upload.single('image_file'), handleUpdatePopup);

// 6. 팝업 활성화 상태 토글 API (PUT & POST)
const handleTogglePopup = async (req, res) => {
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
        res.status(500).json({ success: false, message: 'DB 토글 에러: ' + (err.message || '서버 에러') });
    }
};

router.put('/api/popup/toggle/:id', checkAuth, handleTogglePopup);
router.post('/api/popup/toggle/:id', checkAuth, handleTogglePopup);

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
