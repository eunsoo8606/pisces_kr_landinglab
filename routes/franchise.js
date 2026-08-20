// 관리자용 가맹점/매장 관리 라우터 및 CRUD API
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { checkAuth } = require('./auth');

// 1. 가맹점 목록 조회 (GET /console/franchise)
router.get('/', checkAuth, async (req, res) => {
    try {
        const [stores] = await db.query('SELECT * FROM stores ORDER BY id DESC');
        res.render('console/map/franchise', {
            title: '가맹점 관리',
            user: req.adminUser || { name: '관리자', role: 'admin' },
            adminUser: req.adminUser || { name: '관리자', role: 'admin' },
            currentPage: 'franchise',
            stores: stores
        });
    } catch (err) {
        console.error('❌ Error fetching stores:', err);
        res.status(500).send('가맹점 목록을 불러오는 중 오류가 발생했습니다.');
    }
});

// 2. 가맹점 신규 등록 폼 (GET /console/franchise/add)
router.get('/add', checkAuth, (req, res) => {
    res.render('console/map/franchise-write', {
        title: '가맹점 등록',
        user: req.adminUser || { name: '관리자', role: 'admin' },
        adminUser: req.adminUser || { name: '관리자', role: 'admin' },
        currentPage: 'franchise',
        mode: 'add',
        store: null
    });
});

// 3. 가맹점 신규 등록 처리 (POST /console/franchise/add)
router.post('/add', checkAuth, async (req, res) => {
    try {
        const { name, address, phone, lat, lng, use_yn } = req.body;

        if (!name || !address || !lat || !lng) {
            return res.status(400).send('<script>alert("매장명, 주소, 좌표는 필수 입력 항목입니다."); history.back();</script>');
        }

        await db.query(
            'INSERT INTO stores (name, address, phone, lat, lng, use_yn) VALUES (?, ?, ?, ?, ?, ?)',
            [name.trim(), address.trim(), phone ? phone.trim() : null, parseFloat(lat), parseFloat(lng), use_yn || 'Y']
        );

        console.log(`✅ 가맹점 신규 등록 완료: ${name}`);
        res.redirect('/console/franchise');
    } catch (err) {
        console.error('❌ Error adding store:', err);
        res.status(500).send('가맹점 등록 중 오류가 발생했습니다.');
    }
});

// 4. 가맹점 수정 폼 (GET /console/franchise/edit/:id)
router.get('/edit/:id', checkAuth, async (req, res) => {
    try {
        const storeId = req.params.id;
        const [rows] = await db.query('SELECT * FROM stores WHERE id = ?', [storeId]);

        if (rows.length === 0) {
            return res.status(404).send('<script>alert("존재하지 않는 가맹점입니다."); location.href="/console/franchise";</script>');
        }

        res.render('console/map/franchise-write', {
            title: '가맹점 정보 수정',
            user: req.adminUser || { name: '관리자', role: 'admin' },
            adminUser: req.adminUser || { name: '관리자', role: 'admin' },
            currentPage: 'franchise',
            mode: 'edit',
            store: rows[0]
        });
    } catch (err) {
        console.error('❌ Error fetching store for edit:', err);
        res.status(500).send('가맹점 정보를 불러오는 중 오류가 발생했습니다.');
    }
});

// 5. 가맹점 수정 처리 (POST /console/franchise/edit/:id)
router.post('/edit/:id', checkAuth, async (req, res) => {
    try {
        const storeId = req.params.id;
        const { name, address, phone, lat, lng, use_yn } = req.body;

        if (!name || !address || !lat || !lng) {
            return res.status(400).send('<script>alert("매장명, 주소, 좌표는 필수 입력 항목입니다."); history.back();</script>');
        }

        await db.query(
            'UPDATE stores SET name = ?, address = ?, phone = ?, lat = ?, lng = ?, use_yn = ? WHERE id = ?',
            [name.trim(), address.trim(), phone ? phone.trim() : null, parseFloat(lat), parseFloat(lng), use_yn || 'Y', storeId]
        );

        console.log(`✅ 가맹점 수정 완료 (ID: ${storeId}): ${name}`);
        res.redirect('/console/franchise');
    } catch (err) {
        console.error('❌ Error updating store:', err);
        res.status(500).send('가맹점 정보 수정 중 오류가 발생했습니다.');
    }
});

// 6. 가맹점 삭제 처리 (POST /console/franchise/delete/:id)
router.post('/delete/:id', checkAuth, async (req, res) => {
    try {
        const storeId = req.params.id;
        await db.query('DELETE FROM stores WHERE id = ?', [storeId]);

        console.log(`✅ 가맹점 삭제 완료 (ID: ${storeId})`);
        res.redirect('/console/franchise');
    } catch (err) {
        console.error('❌ Error deleting store:', err);
        res.status(500).send('가맹점 삭제 중 오류가 발생했습니다.');
    }
});

module.exports = router;
