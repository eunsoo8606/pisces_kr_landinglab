const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { sendConsultationNotification } = require('../utils/email');
const { checkAuth } = require('./auth');
const rateLimit = require('express-rate-limit');

// 스팸 방지용 API 속도 제한 미들웨어 정의
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 동일 IP당 15분간 최대 5회 제출 제한
    handler: (req, res) => {
        const isJson = req.headers['content-type'] && req.headers['content-type'].includes('json');
        
        console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip || req.headers['x-forwarded-for']}`);

        if (isJson) {
            return res.status(429).json({ 
                success: false, 
                message: '단시간에 너무 많은 요청이 발생했습니다. 15분 후에 다시 시도해 주세요.' 
            });
        } else {
            return res.status(429).send(
                "<script>alert('단시간에 너무 많은 상담 신청이 발생했습니다. 잠시 후(15분 뒤) 다시 시도해 주세요.'); history.back();</script>"
            );
        }
    },
    standardHeaders: true, // RateLimit-* 헤더 반환
    legacyHeaders: false, // X-RateLimit-* 구버전 헤더 비활성화
});

// 1. 창업 문의/상담 신청 접수 API (Rate Limiter 적용)
router.post('/inquire', apiLimiter, async (req, res) => {
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

// 3. 사용자 고객의 소리 (Voice) 접수 API (Rate Limiter 적용)
router.post('/api/community/voice', apiLimiter, async (req, res) => {
    const { name, phone, content } = req.body;

    if (!name || !phone || !content) {
        return res.status(400).json({ success: false, message: '작성자 성함, 연락처, 불편 사항을 모두 입력해 주세요.' });
    }

    try {
        const title = `${name}님의 불편/불만 접수`;
        
        await db.query(
            `INSERT INTO boards (category, title, content, author_name, author_phone, is_private, status)
             VALUES ('voice', ?, ?, ?, ?, 1, 'pending')`,
            [title, content, name, phone]
        );

        res.json({ success: true, message: '고객의 소리가 성공적으로 접수되었습니다.' });
    } catch (err) {
        console.error('❌ Error submitting voice:', err);
        res.status(500).json({ success: false, message: '서버 오류로 인해 접수에 실패했습니다.' });
    }
});

// 4. 사용자 가맹 및 제휴 문의 (Inquiry) 접수 API (Rate Limiter 적용)
router.post('/api/community/inquiry', apiLimiter, async (req, res) => {
    const { name, phone, email, type, content } = req.body;

    if (!name || !phone || !type || !content) {
        return res.status(400).json({ success: false, message: '작성자 성함, 연락처, 문의 분류 및 내용을 모두 입력해 주세요.' });
    }

    try {
        const typeMap = {
            'franchise': '신규 가맹/창업',
            'location': '매장 개설/상권 분석',
            'alliance': '비즈니스 제휴/납품',
            'other': '기타 문의사항'
        };
        const typeName = typeMap[type] || '기타 문의';
        const title = `${name}님의 가맹/제휴 문의 (${typeName})`;

        await db.query(
            `INSERT INTO boards (category, title, content, author_name, author_phone, author_email, inquiry_type, is_private, status)
             VALUES ('inquiry', ?, ?, ?, ?, ?, ?, 1, 'pending')`,
            [title, content, name, phone, email || null, type]
        );

        res.json({ success: true, message: '문의 사항이 성공적으로 접수되었습니다.' });
    } catch (err) {
        console.error('❌ Error submitting inquiry:', err);
        res.status(500).json({ success: false, message: '서버 오류로 인해 접수에 실패했습니다.' });
    }
});

module.exports = router;

