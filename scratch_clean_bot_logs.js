require('dotenv').config();
const db = require('./db/database');

async function cleanLogs() {
    console.log('🧹 봇 및 로컬 테스트 접속 기록 DB 정화 작업 시작...');

    // 1. 로컬 IP 및 루프백 쿼리 삭제
    const [localResult] = await db.query(`
        DELETE FROM visitor_logs 
        WHERE ip_address LIKE '%127.0.0.1%' 
           OR ip_address LIKE '%::1%' 
           OR ip_address LIKE '192.168.%' 
           OR ip_address LIKE '10.%'
           OR country = 'Localhost'
    `);
    console.log(`✅ 로컬 IP 접속 기록 ${localResult.affectedRows}건 삭제 완료!`);

    // 2. 봇 / 크롤러 / 자동화 스크립트 로그 삭제
    const [botResult] = await db.query(`
        DELETE FROM visitor_logs 
        WHERE user_agent REGEXP 'bot|crawl|spider|slurp|facebookexternalhit|twitterbot|pinterest|whatsapp|telegrambot|discordbot|curl|wget|python|postman|axios|fetch|lighthouse|inspect|checker|scan|search|headless|phantom|selenium'
           OR user_agent IS NULL 
           OR user_agent = ''
    `);
    console.log(`✅ 봇/크롤러 자동 접속 기록 ${botResult.affectedRows}건 삭제 완료!`);

    console.log('🎉 visitor_logs 순수 실사용자 로그 정화 완료!');
    process.exit(0);
}

cleanLogs().catch(err => {
    console.error('❌ 로그 정화 작업 중 에러 발생:', err);
    process.exit(1);
});
