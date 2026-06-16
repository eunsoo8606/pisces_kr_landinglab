const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { sendConsultationNotification } = require('../utils/email');
const { checkAuth } = require('./auth');

// 1. 창업 문의/상담 신청 접수 API
router.post('/inquire', async (req, res) => {
    try {
        const isJson = req.headers['content-type'] && req.headers['content-type'].includes('json');

        // 필드 파싱 (일반 Form Submit 데이터 및 JSON Ajax 데이터 모두 대응)
        const name = req.body.name || req.body.inquirerName;
        const phone = req.body.phone || req.body.inquirerPhone;
        const email = req.body.email || '';
        const region = req.body.region || '';
        const message = req.body.message || '';

        // 유효성 체크
        if (!name || !phone) {
            if (isJson) {
                return res.status(400).json({ success: false, message: '성함과 연락처는 필수 항목입니다.' });
            } else {
                return res.send("<script>alert('성함과 연락처는 필수 입력 항목입니다.'); history.back();</script>");
            }
        }

        // 1-1. DB 저장
        await db.query(
            `INSERT INTO inquiries (name, phone, email, region, message, status) 
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [name, phone, email, region, message]
        );

        // 1-2. 관리자 메일 알림 전송 (메일 전송 실패 시에도 접수는 완료되도록 처리)
        try {
            await sendConsultationNotification({
                name,
                phone,
                email,
                region,
                message
            });
        } catch (mailErr) {
            console.error('⚠️ Mail send error in API route:', mailErr);
        }

        if (isJson) {
            return res.json({ success: true, message: '창업 상담 신청이 접수되었습니다.' });
        } else {
            return res.send("<script>alert('성공적으로 창업 상담 신청이 접수되었습니다.'); location.href='/';</script>");
        }
    } catch (err) {
        console.error('❌ Error saving inquiry in API route:', err);
        if (req.headers['content-type'] && req.headers['content-type'].includes('json')) {
            return res.status(500).json({ success: false, message: '서버 오류로 인해 접수에 실패하였습니다.' });
        } else {
            return res.send("<script>alert('서버 오류로 접수 중 에러가 발생하였습니다. 잠시 후 다시 시도해 주세요.'); history.back();</script>");
        }
    }
});

// 2. 가맹 상담 상태 변경 API (관리자 전용 비동기 API)
router.post('/api/inquiry/status', checkAuth, async (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
        return res.status(400).json({ success: false, message: '상담 ID와 변경할 상태 정보가 누락되었습니다.' });
    }

    // 허용 상태값 검증
    const allowedStatuses = ['pending', 'complete', 'canceled'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: '유효하지 않은 상태값 설정 요청입니다.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE inquiries SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '해당 상담 신청 기록을 찾을 수 없습니다.' });
        }

        return res.json({ success: true, message: '상담 신청건의 처리 상태가 업데이트되었습니다.' });
    } catch (err) {
        console.error('❌ Error updating inquiry status:', err);
        return res.status(500).json({ success: false, message: '서버 데이터베이스 업데이트 에러가 발생하였습니다.' });
    }
});

module.exports = router;
