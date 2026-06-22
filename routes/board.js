// 관리자용 게시판 관리 라우터 및 CRUD API
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { checkAuth } = require('./auth');

// 1. 공통 게시판 목록 조회 헬퍼 함수
async function handleBoardList(req, res, category) {
    const search = req.query.search || '';
    const searchType = req.query.search_type || 'all'; // all: 통합, title: 제목, content: 내용, author: 작성자
    const startDate = req.query.start_date || '';
    const endDate = req.query.end_date || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    try {
        let countQuery = 'SELECT COUNT(*) AS total FROM boards WHERE category = ?';
        let selectQuery = 'SELECT * FROM boards WHERE category = ?';
        let queryParams = [category];

        // 1-1. 기간 검색 조건 반영 (start_date <= created_at <= end_date)
        if (startDate) {
            countQuery += ' AND created_at >= ?';
            selectQuery += ' AND created_at >= ?';
            queryParams.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            countQuery += ' AND created_at <= ?';
            selectQuery += ' AND created_at <= ?';
            queryParams.push(`${endDate} 23:59:59`);
        }

        // 1-2. 검색 범위 및 검색어 필터링 반영
        if (search) {
            const searchParam = `%${search}%`;
            if (searchType === 'title') {
                countQuery += ' AND title LIKE ?';
                selectQuery += ' AND title LIKE ?';
                queryParams.push(searchParam);
            } else if (searchType === 'content') {
                countQuery += ' AND content LIKE ?';
                selectQuery += ' AND content LIKE ?';
                queryParams.push(searchParam);
            } else if (searchType === 'author') {
                countQuery += ' AND author_name LIKE ?';
                selectQuery += ' AND author_name LIKE ?';
                queryParams.push(searchParam);
            } else {
                // 통합 검색 (제목 + 내용 + 작성자)
                countQuery += ' AND (title LIKE ? OR content LIKE ? OR author_name LIKE ?)';
                selectQuery += ' AND (title LIKE ? OR content LIKE ? OR author_name LIKE ?)';
                queryParams.push(searchParam, searchParam, searchParam);
            }
        }

        // 1-3. 정렬 순서 처리
        if (category === 'notice') {
            selectQuery += ' ORDER BY is_pinned DESC, created_at DESC';
        } else if (category === 'faq') {
            selectQuery += ' ORDER BY id ASC';
        } else {
            selectQuery += ' ORDER BY created_at DESC';
        }

        selectQuery += ' LIMIT ? OFFSET ?';
        
        const countParams = [...queryParams];
        queryParams.push(limit, offset);

        const [[countResult], [listResult]] = await Promise.all([
            db.query(countQuery, countParams),
            db.query(selectQuery, queryParams)
        ]);

        const totalItems = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        res.render('console/board_list', {
            title: `물고기자리 관리자 콘솔 - ${getCategoryLabel(category)} 관리`,
            adminUser: req.adminUser,
            currentCategory: category,
            list: listResult,
            search,
            searchType,
            startDate,
            endDate,
            currentPage: page,
            totalPages,
            totalItems,
            activeMenu: `board_${category}`
        });
    } catch (err) {
        console.error(`❌ Failed to load admin board list (${category}):`, err);
        res.status(500).send('<h1>게시판 목록 로드 중 서버 내부 에러가 발생했습니다.</h1>');
    }
}

// 카테고리별 한글 라벨 맵핑 함수
function getCategoryLabel(category) {
    const map = {
        'notice': '공지사항',
        'faq': '자주 묻는 질문(FAQ)',
        'voice': '고객의 소리',
        'inquiry': '문의게시판'
    };
    return map[category] || '게시판';
}

// 1-4. 카테고리별 개별 라우팅 설정
router.get('/console/board/notice', checkAuth, (req, res) => handleBoardList(req, res, 'notice'));
router.get('/console/board/faq', checkAuth, (req, res) => handleBoardList(req, res, 'faq'));
router.get('/console/board/voice', checkAuth, (req, res) => handleBoardList(req, res, 'voice'));
router.get('/console/board/inquiry', checkAuth, (req, res) => handleBoardList(req, res, 'inquiry'));

// 기존 주소(/console/board) 접근 시 공지사항 관리로 리다이렉트
router.get('/console/board', checkAuth, (req, res) => {
    res.redirect('/console/board/notice');
});

// 2. 관리자 게시글 등록 폼 (GET /console/board/write)
router.get('/console/board/write', checkAuth, (req, res) => {
    const category = req.query.category || 'notice';
    res.render('console/board_form', {
        title: '물고기자리 관리자 콘솔 - 게시글 작성',
        adminUser: req.adminUser,
        action: 'write',
        category,
        board: null,
        activeMenu: `board_${category}`
    });
});

// 3. 관리자 게시글 수정/답변 등록 폼 (GET /console/board/edit/:id)
router.get('/console/board/edit/:id', checkAuth, async (req, res) => {
    const id = req.params.id;

    try {
        const [rows] = await db.query('SELECT * FROM boards WHERE id = ? LIMIT 1', [id]);
        if (rows.length === 0) {
            return res.send("<script>alert('해당 게시글을 찾을 수 없습니다.'); location.href='/console/board';</script>");
        }

        res.render('console/board_form', {
            title: '물고기자리 관리자 콘솔 - 게시글 관리',
            adminUser: req.adminUser,
            action: 'edit',
            category: rows[0].category,
            board: rows[0],
            activeMenu: `board_${rows[0].category}`
        });
    } catch (err) {
        console.error('❌ Failed to load board edit form:', err);
        res.status(500).send('<h1>데이터 조회 중 오류가 발생했습니다.</h1>');
    }
});

// 4. 게시글 생성 API (POST /api/board)
router.post('/api/board', checkAuth, async (req, res) => {
    const { category, title, content, is_pinned, is_private } = req.body;

    if (!category || !title || !content) {
        return res.status(400).json({ success: false, message: '카테고리, 제목, 내용은 필수 입력 항목입니다.' });
    }

    try {
        const pinned = is_pinned === '1' || is_pinned === 1 ? 1 : 0;
        const privated = is_private === '1' || is_private === 1 ? 1 : 0;

        await db.query(
            `INSERT INTO boards (category, title, content, author_name, is_pinned, is_private, status)
             VALUES (?, ?, ?, ?, ?, ?, 'complete')`,
            [category, title, content, req.adminUser.name, pinned, privated]
        );

        res.json({ success: true, message: '성공적으로 등록되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to insert board:', err);
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

// 5. 게시글 수정 API (PUT /api/board/:id)
router.put('/api/board/:id', checkAuth, async (req, res) => {
    const id = req.params.id;
    const { title, content, is_pinned, is_private } = req.body;

    if (!title || !content) {
        return res.status(400).json({ success: false, message: '제목과 내용은 필수 입력 항목입니다.' });
    }

    try {
        const pinned = is_pinned === '1' || is_pinned === 1 ? 1 : 0;
        const privated = is_private === '1' || is_private === 1 ? 1 : 0;

        const [result] = await db.query(
            `UPDATE boards 
             SET title = ?, content = ?, is_pinned = ?, is_private = ?
             WHERE id = ?`,
            [title, content, pinned, privated, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '수정할 대상을 찾을 수 없습니다.' });
        }

        res.json({ success: true, message: '게시글이 성공적으로 수정되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to update board:', err);
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

// 6. 게시글 삭제 API (DELETE /api/board/:id)
router.delete('/api/board/:id', checkAuth, async (req, res) => {
    const id = req.params.id;

    try {
        const [result] = await db.query('DELETE FROM boards WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '삭제할 대상을 찾을 수 없습니다.' });
        }

        res.json({ success: true, message: '성공적으로 삭제되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to delete board:', err);
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

// 7. 고객 문의 및 고객의 소리 답변 등록 API (POST /api/board/reply/:id)
router.post('/api/board/reply/:id', checkAuth, async (req, res) => {
    const id = req.params.id;
    const { reply_content, status } = req.body;

    if (!reply_content) {
        return res.status(400).json({ success: false, message: '답변 내용은 필수 항목입니다.' });
    }

    try {
        const [result] = await db.query(
            `UPDATE boards 
             SET reply_content = ?, replied_at = NOW(), status = ?
             WHERE id = ? AND category IN ('voice', 'inquiry')`,
            [reply_content, status || 'complete', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '답변을 등록할 고객 문의글을 찾을 수 없습니다.' });
        }

        res.json({ success: true, message: '답변이 성공적으로 등록되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to save board reply:', err);
        res.status(500).json({ success: false, message: '서버 내부 DB 에러가 발생했습니다.' });
    }
});

module.exports = router;
