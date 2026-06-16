-- Database: pisces_db
-- Description: 물고기자리 프리미엄 숙성회 랜딩페이지 시스템 스키마 초기화 SQL

-- 1. 데이터베이스 생성 (다국어 및 이모지 지원을 위해 utf8mb4 설정)
CREATE DATABASE IF NOT EXISTS pisces_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pisces_db;

-- 2. 외부 접속용 사용자 계정 생성 (사용 시 'your_secure_password'를 안전한 비밀번호로 변경 권장)
CREATE USER IF NOT EXISTS 'pisces_user'@'%' IDENTIFIED BY 'your_secure_password';

-- 3. 해당 데이터베이스에 대한 모든 권한 부여
GRANT ALL PRIVILEGES ON pisces_db.* TO 'pisces_user'@'%';

-- 4. 권한 적용
FLUSH PRIVILEGES;

-- ==========================================================================
-- 테이블 생성
-- ==========================================================================

-- 5. 사용자 테이블 (users)
-- 어드민/가맹점 관리자가 대시보드 접근 및 관리 처리를 위한 테이블
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 번호',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '로그인 아이디',
    password VARCHAR(255) NOT NULL COMMENT '암호화된 비밀번호 (해시값)',
    name VARCHAR(50) NOT NULL COMMENT '사용자 실명',
    email VARCHAR(100) UNIQUE COMMENT '이메일 주소',
    role VARCHAR(20) DEFAULT 'admin' COMMENT '권한 등급 (admin, manager)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='관리자 사용자 테이블';

-- 6. 가맹 상담 신청 테이블 (inquiries)
-- 메인 랜딩페이지의 실시간 창업 문의 폼을 통해 접수되는 정보를 저장하는 테이블
CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '상담 신청 고유 번호',
    name VARCHAR(50) NOT NULL COMMENT '신청자 성함',
    phone VARCHAR(20) NOT NULL COMMENT '연락처 (하이픈 포함 혹은 미포함)',
    email VARCHAR(100) COMMENT '이메일 주소',
    region VARCHAR(100) COMMENT '창업 희망 지역',
    message TEXT COMMENT '상세 문의 사항',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '처리 상태 (pending: 대기, complete: 완료, canceled: 취소)',
    privacy_agreement TINYINT(1) DEFAULT 1 COMMENT '개인정보 수집 동의 여부 (1: 동의)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '신청 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '상태 변경 시간'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='가맹 상담 신청 정보 테이블';

-- 7. 방문자 접속 로그 (visitor_logs)
-- 대시보드 유입 통계 및 기기/국가별 분석을 위한 퍼스널 접속 로그 테이블
CREATE TABLE IF NOT EXISTS visitor_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '로그 고유 번호',
    ip_address VARCHAR(45) NOT NULL COMMENT '접속 IP 주소 (IPv4 및 IPv6 지원)',
    country VARCHAR(100) DEFAULT 'Unknown' COMMENT '접속 국가명 (예: South Korea, US 등)',
    country_code CHAR(2) DEFAULT 'XX' COMMENT '국가 코드 2자리 (예: KR, US)',
    device_type VARCHAR(20) DEFAULT 'PC' COMMENT '기기 종류 (PC, Mobile, Tablet, Robot 등)',
    os_name VARCHAR(50) DEFAULT 'Unknown' COMMENT '운영체제 명칭 (Windows, macOS, iOS, Android 등)',
    browser_name VARCHAR(50) DEFAULT 'Unknown' COMMENT '브라우저 명칭 (Chrome, Safari, Firefox, IE 등)',
    referer TEXT COMMENT '유입 경로 (이전 페이지 URL 또는 검색 유입 출처)',
    requested_url VARCHAR(255) COMMENT '접속한 페이지 경로 (예: /, /menu, /brand/about)',
    user_agent TEXT COMMENT '브라우저 유저 에이전트 정보 원본',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '방문 접속 시간'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='방문자 접속 로그(퍼스널 로그) 테이블';

-- 통계 쿼리 최적화를 위한 인덱스 추가
CREATE INDEX idx_visitor_created_at ON visitor_logs(created_at);
CREATE INDEX idx_visitor_device ON visitor_logs(device_type);
CREATE INDEX idx_visitor_country ON visitor_logs(country_code);
