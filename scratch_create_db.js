// 1회성 boards 테이블 생성 스크립트
require('dotenv').config();
const db = require('./db/database');

const query = `
CREATE TABLE IF NOT EXISTS boards (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 번호',
    category VARCHAR(20) NOT NULL COMMENT '게시판 종류 (notice: 공지사항, faq: 자주묻는질문, voice: 고객의소리, inquiry: 문의게시판)',
    title VARCHAR(255) NOT NULL COMMENT '글 제목 (FAQ는 질문)',
    content TEXT NOT NULL COMMENT '글 내용 (FAQ는 답변)',
    author_name VARCHAR(50) DEFAULT NULL COMMENT '작성자 이름',
    author_phone VARCHAR(20) DEFAULT NULL COMMENT '작성자 연락처',
    author_email VARCHAR(100) DEFAULT NULL COMMENT '작성자 이메일',
    inquiry_type VARCHAR(50) DEFAULT NULL COMMENT '문의 분류 (franchise, location, alliance, other)',
    is_pinned TINYINT(1) DEFAULT 0 COMMENT '상단 고정 여부 (1: 고정, 0: 일반)',
    is_private TINYINT(1) DEFAULT 1 COMMENT '비밀글 여부 (1: 비밀글, 0: 공개글)',
    views INT DEFAULT 0 COMMENT '조회수',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '처리 상태 (pending: 답변대기/접수완료, complete: 답변완료)',
    reply_content TEXT DEFAULT NULL COMMENT '관리자 답변 내용',
    replied_at TIMESTAMP DEFAULT NULL COMMENT '답변 작성 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공통 게시판 테이블';
`;

const index1 = `CREATE INDEX idx_boards_category ON boards(category);`;
const index2 = `CREATE INDEX idx_boards_created_at ON boards(created_at);`;

async function main() {
    try {
        console.log('Connecting to database and creating boards table...');
        await db.query(query);
        console.log('✅ Boards table created successfully.');
        
        try {
            await db.query(index1);
            console.log('✅ Index idx_boards_category created.');
        } catch (e) {
            console.log('Index idx_boards_category might already exist or skipped:', e.message);
        }
        
        try {
            await db.query(index2);
            console.log('✅ Index idx_boards_created_at created.');
        } catch (e) {
            console.log('Index idx_boards_created_at might already exist or skipped:', e.message);
        }
    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        process.exit(0);
    }
}

main();
