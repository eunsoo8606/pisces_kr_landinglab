// utils/sms.js 모듈 재참조 및 하위 호환성 유지
const smsUtils = require('../../utils/sms');

module.exports = {
    ...smsUtils
};
