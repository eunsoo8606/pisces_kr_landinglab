const { SolapiMessageService } = require('solapi');
require('dotenv').config();

// ==========================================
// 솔라피(Solapi) 환경 변수 설정
// ==========================================
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_SENDER = process.env.SOLAPI_SENDER || '';
const SOLAPI_RECEIVER = process.env.SOLAPI_RECEIVER || '';

// 솔라피 메시지 서비스 인스턴스 초기화 (싱글톤)
let messageService = null;
if (SOLAPI_API_KEY && SOLAPI_API_SECRET) {
    try {
        messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    } catch (initErr) {
        console.error('❌ [Solapi SMS] 메시지 서비스 초기화 실패:', initErr.message);
    }
}

/**
 * 전화번호 정제 헬퍼 (숫자만 추출)
 * @param {string} phone 
 * @returns {string}
 */
function cleanPhoneNumber(phone) {
    if (!phone) return '';
    return String(phone).replace(/[^0-9]/g, '');
}

/**
 * 발송 환경 체크 헬퍼
 * @returns {boolean}
 */
function isConfigured() {
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
        console.warn('⚠️ [Solapi SMS] API KEY 또는 SECRET KEY가 .env에 설정되지 않아 발송을 건너뜁니다.');
        return false;
    }
    if (!SOLAPI_SENDER || !SOLAPI_RECEIVER) {
        console.warn('⚠️ [Solapi SMS] 발신인(SOLAPI_SENDER) 혹은 수신인(SOLAPI_RECEIVER) 번호가 설정되지 않았습니다.');
        return false;
    }
    return true;
}

/**
 * 신규 창업 상담 신청 발생 시 관리자 휴대폰으로 알림 문자를 발송합니다.
 * @param {Object} data 상담 신청 데이터
 * @param {string} data.name 신청자 성함
 * @param {string} data.phone 신청자 연락처
 * @param {string} [data.region] 희망 지역 또는 거주지
 * @param {string} [data.email] 이메일 주소
 * @param {string} [data.message] 문의/상담 상세 내용
 * @param {string} [data.visitPath] 방문/유입 경로
 * @param {string} [data.experience] 창업 경험 유무
 * @returns {Promise<Object|null>}
 */
async function sendConsultationSms(data = {}) {
    if (!isConfigured()) return null;

    const {
        name = '고객',
        phone = '',
        region = '',
        email = '',
        message = '',
        visitPath = '',
        experience = ''
    } = data;

    // 장문(LMS) 또는 단문(SMS) 알림 메시지 본문 구성
    let msg = `[물고기자리] 창업 상담 문의 접수\n`;
    msg += `■ 성함: ${name}\n`;
    msg += `■ 연락처: ${phone}\n`;
    if (region) msg += `■ 희망지역: ${region}\n`;
    if (email) msg += `■ 이메일: ${email}\n`;
    if (visitPath) msg += `■ 유입경로: ${visitPath}\n`;
    if (experience) msg += `■ 창업경험: ${experience}\n`;
    if (message) {
        // 메시지가 너무 긴 경우 가독성을 위해 일부 축약 (최대 300자)
        const trimmedMessage = message.length > 300 ? `${message.substring(0, 300)}...` : message;
        msg += `■ 문의내용:\n${trimmedMessage}`;
    }

    try {
        const sender = cleanPhoneNumber(SOLAPI_SENDER);
        const receiver = cleanPhoneNumber(SOLAPI_RECEIVER);

        if (!messageService) {
            messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);
        }

        const response = await messageService.send({
            to: receiver,
            from: sender,
            text: msg
        });

        console.log(`✅ [Solapi SMS] 창업 상담 알림 발송 완료 (${name} / ${phone}):`, response);
        return response;
    } catch (error) {
        console.error('❌ [Solapi SMS Error] 창업 상담 알림 발송 실패:', error);
        return null;
    }
}

/**
 * 커뮤니티 가맹/제휴 문의 접수 시 관리자 휴대폰으로 알림 문자를 발송합니다.
 * @param {Object} data 가맹/제휴 문의 데이터
 * @param {string} data.name 작성자 성함
 * @param {string} data.phone 연락처
 * @param {string} [data.email] 이메일
 * @param {string} [data.type] 문의 유형 (franchise, location, alliance, other)
 * @param {string} [data.content] 문의 내용
 * @returns {Promise<Object|null>}
 */
async function sendInquirySms(data = {}) {
    if (!isConfigured()) return null;

    const {
        name = '고객',
        phone = '',
        email = '',
        type = '',
        content = ''
    } = data;

    const typeMap = {
        'franchise': '신규 가맹/창업',
        'location': '매장 개설/상권 분석',
        'alliance': '비즈니스 제휴/납품',
        'other': '기타 문의'
    };
    const typeLabel = typeMap[type] || type || '가맹/제휴 문의';

    let msg = `[물고기자리] ${typeLabel} 접수\n`;
    msg += `■ 성함: ${name}\n`;
    msg += `■ 연락처: ${phone}\n`;
    if (email) msg += `■ 이메일: ${email}\n`;
    if (content) {
        const trimmed = content.length > 300 ? `${content.substring(0, 300)}...` : content;
        msg += `■ 내용:\n${trimmed}`;
    }

    try {
        const sender = cleanPhoneNumber(SOLAPI_SENDER);
        const receiver = cleanPhoneNumber(SOLAPI_RECEIVER);

        if (!messageService) {
            messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);
        }

        const response = await messageService.send({
            to: receiver,
            from: sender,
            text: msg
        });

        console.log(`✅ [Solapi SMS] 가맹/제휴 문의 알림 발송 완료 (${name} / ${phone}):`, response);
        return response;
    } catch (error) {
        console.error('❌ [Solapi SMS Error] 가맹/제휴 알림 발송 실패:', error);
        return null;
    }
}

/**
 * 기존 코드 호환용 관리자 알림 발송 함수
 * - 객체 전달 방식 및 기존 인자 전달 방식 모두 지원
 */
async function sendAdminNotification(arg1, phone, region, message) {
    if (typeof arg1 === 'object' && arg1 !== null) {
        return await sendConsultationSms(arg1);
    }
    return await sendConsultationSms({
        name: arg1 || '신규 문의',
        phone: phone || '',
        region: region || '',
        message: message || ''
    });
}

module.exports = {
    sendConsultationSms,
    sendInquirySms,
    sendAdminNotification
};
