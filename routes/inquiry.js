// 관리자용 창업 상담 신청 내역 관리 라우터
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { checkAuth } = require('./auth');

/**
 * 1. 창업 상담 신청 내역 목록 조회 (GET /console/inquiry)
 */
router.get('/console/inquiry', checkAuth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const offset = (page - 1) * limit;

    const status = req.query.status || 'all'; // all, pending, complete, canceled
    const search = req.query.search ? req.query.search.trim() : '';
    const searchType = req.query.search_type || 'all'; // all, name, phone, region, message
    const startDate = req.query.start_date || '';
    const endDate = req.query.end_date || '';

    try {
        // 1-1. 상단 통계 수치 집계 (전체, 접수대기, 상담완료, 취소 건수)
        const [statsRows] = await db.query(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS complete,
                SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) AS canceled
            FROM inquiries
        `);

        const stats = {
            total: statsRows[0]?.total || 0,
            pending: Number(statsRows[0]?.pending) || 0,
            complete: Number(statsRows[0]?.complete) || 0,
            canceled: Number(statsRows[0]?.canceled) || 0
        };

        // 1-2. 필터 조건 조립
        let whereClauses = [];
        let queryParams = [];

        // 상태 필터
        if (status && status !== 'all') {
            whereClauses.push('status = ?');
            queryParams.push(status);
        }

        // 기간 필터
        if (startDate) {
            whereClauses.push('created_at >= ?');
            queryParams.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereClauses.push('created_at <= ?');
            queryParams.push(`${endDate} 23:59:59`);
        }

        // 검색 필터
        if (search) {
            const searchPattern = `%${search}%`;
            if (searchType === 'name') {
                whereClauses.push('name LIKE ?');
                queryParams.push(searchPattern);
            } else if (searchType === 'phone') {
                whereClauses.push('phone LIKE ?');
                queryParams.push(searchPattern);
            } else if (searchType === 'region') {
                whereClauses.push('region LIKE ?');
                queryParams.push(searchPattern);
            } else if (searchType === 'message') {
                whereClauses.push('message LIKE ?');
                queryParams.push(searchPattern);
            } else {
                whereClauses.push('(name LIKE ? OR phone LIKE ? OR email LIKE ? OR region LIKE ? OR message LIKE ?)');
                queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
            }
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 1-3. 카운트 쿼리 및 목록 쿼리 실행
        const countQuery = `SELECT COUNT(*) AS count FROM inquiries ${whereSql}`;
        const selectQuery = `
            SELECT id, name, phone, email, region, message, status, privacy_agreement, created_at, updated_at 
            FROM inquiries 
            ${whereSql} 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await db.query(countQuery, queryParams);
        const totalItems = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        const listQueryParams = [...queryParams, limit, offset];
        const [inquiries] = await db.query(selectQuery, listQueryParams);

        res.render('console/inquiry_list', {
            title: '물고기자리 관리자 콘솔 - 창업 상담 문의 관리',
            adminUser: req.adminUser,
            inquiries,
            stats,
            currentStatus: status,
            search,
            searchType,
            startDate,
            endDate,
            currentPage: page,
            totalPages,
            totalItems,
            activeMenu: 'inquiry'
        });
    } catch (err) {
        console.error('❌ Failed to load inquiries list:', err);
        res.status(500).send('<h1>창업 상담 목록을 불러오는 중 서버 오류가 발생했습니다.</h1>');
    }
});

/**
 * 2. 상담 처리 상태 변경 API (POST /console/inquiry/status)
 */
router.post('/console/inquiry/status', checkAuth, async (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
        return res.status(400).json({ success: false, message: '필수 파라미터가 누락되었습니다.' });
    }

    const validStatuses = ['pending', 'complete', 'canceled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: '유효하지 않은 상태값입니다.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE inquiries SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '해당 상담 내역을 찾을 수 없습니다.' });
        }

        res.json({ success: true, message: '상담 상태가 성공적으로 변경되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to update inquiry status:', err);
        res.status(500).json({ success: false, message: '서버 오류로 인해 상태 변경에 실패했습니다.' });
    }
});

/**
 * 3. 상담 내역 삭제 API (POST /console/inquiry/delete/:id)
 */
router.post('/console/inquiry/delete/:id', checkAuth, async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID가 누락되었습니다.' });
    }

    try {
        const [result] = await db.query('DELETE FROM inquiries WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '해당 상담 내역을 찾을 수 없습니다.' });
        }

        res.json({ success: true, message: '성공적으로 삭제되었습니다.' });
    } catch (err) {
        console.error('❌ Failed to delete inquiry:', err);
        res.status(500).json({ success: false, message: '서버 오류로 인해 삭제에 실패했습니다.' });
    }
});

/**
 * 4. 상담 내역 CSV 엑셀 다운로드 (GET /console/inquiry/export-csv)
 */
router.get('/console/inquiry/export-csv', checkAuth, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, phone, email, region, message, status, created_at FROM inquiries ORDER BY created_at DESC'
        );

        // UTF-8 BOM 추가 (Excel 한글 깨짐 방지)
        let csvContent = '\uFEFF';
        csvContent += '번호,신청자명,연락처,이메일,희망지역,문의내용,처리상태,접수일시\r\n';

        const statusLabelMap = {
            'pending': '접수대기',
            'complete': '상담완료',
            'canceled': '취소'
        };

        rows.forEach((row, idx) => {
            const cleanMessage = (row.message || '').replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, ' ');
            const dateStr = row.created_at ? new Date(row.created_at).toISOString().replace(/T/, ' ').replace(/\..+/, '') : '';
            const statusStr = statusLabelMap[row.status] || row.status;

            csvContent += `"${row.id}","${row.name || ''}","${row.phone || ''}","${row.email || ''}","${row.region || ''}","${cleanMessage}","${statusStr}","${dateStr}"\r\n`;
        });

        const now = new Date();
        const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `pisces_inquiries_${yyyymmdd}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
    } catch (err) {
        console.error('❌ Failed to export CSV:', err);
        res.status(500).send('CSV 내보내기 중 오류가 발생했습니다.');
    }
});

module.exports = router;
