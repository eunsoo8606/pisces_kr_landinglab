/**
 * ============================================================================
 * shorts.js - 서클 마스크 리빌 & 유튜브 쇼츠 전용 독립 컴포넌트 모듈
 * ============================================================================
 */
(function () {
    'use strict';

    function initRevealShorts() {
        const revealSectionEl = document.querySelector('.reveal-section');
        if (!revealSectionEl) return;

        const isMobileDevice = window.innerWidth <= 768;

        // GSAP ScrollTrigger 핀 및 리빌 타임라인은 main.js에서 메인 타임라인 체인과 함께 통합 관리됩니다.

        // ------------------------------------------------------------------------
        // 2. 쇼츠 캐러셀 컨트롤러 (PC 3열 나열 / 모바일 1열 슬라이더)
        // ------------------------------------------------------------------------
        const shortsCards = revealSectionEl.querySelectorAll('.shorts-card');
        const shortsDots = revealSectionEl.querySelectorAll('.shorts-dot');
        const shortsSliderTrack = revealSectionEl.querySelector('#shortsSliderTrack');
        const shortsPrevBtn = revealSectionEl.querySelector('#shortsPrevBtn');
        const shortsNextBtn = revealSectionEl.querySelector('#shortsNextBtn');
        const screenOverlays = revealSectionEl.querySelectorAll('.shorts-screen-overlay');

        if (shortsCards.length === 0) return;

        let currentShortsIndex = 0;
        const totalShorts = shortsCards.length;

        // 유튜브 iframe 제어 헬퍼
        const postYtCommand = (iframe, command) => {
            if (!iframe || !iframe.contentWindow) return;
            try {
                iframe.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: command,
                    args: ''
                }), '*');
            } catch (e) {
                // cross-origin safety
            }
        };

        const playShortsIndex = (index) => {
            const card = shortsCards[index];
            if (!card) return;
            const iframe = card.querySelector('iframe');
            if (!iframe) return;

            // 영상 내부 화살표/컨트롤 완전 차단 클린 파라미터 보장
            const videoId = card.dataset.videoId;
            if (videoId) {
                const targetSrc = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0`;
                if (!iframe.src.includes('controls=0') || !iframe.src.includes(`embed/${videoId}`)) {
                    iframe.src = targetSrc;
                } else {
                    postYtCommand(iframe, 'playVideo');
                }
            } else {
                postYtCommand(iframe, 'playVideo');
            }
            card.classList.remove('is-paused');
        };

        const pauseShortsIndex = (index) => {
            const card = shortsCards[index];
            if (!card) return;
            const iframe = card.querySelector('iframe');
            if (iframe) {
                postYtCommand(iframe, 'pauseVideo');
            }
        };

        // 슬라이드 변경 (모바일 환경에서만 카드 활성화 전환 수행)
        const goToShorts = (newIndex) => {
            const prevIndex = currentShortsIndex;
            currentShortsIndex = (newIndex + totalShorts) % totalShorts;

            // 이전 영상 멈춤
            pauseShortsIndex(prevIndex);

            // 카드 활성화 전환
            shortsCards.forEach((card, idx) => {
                if (idx === currentShortsIndex) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                    card.classList.remove('is-paused');
                }
            });

            // 도트 인디케이터 갱신
            shortsDots.forEach((dot, idx) => {
                if (idx === currentShortsIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });

            // 현재 슬라이드 영상 즉시 재생
            setTimeout(() => {
                playShortsIndex(currentShortsIndex);
            }, 100);
        };

        // 모바일 외부 좌우 화살표 버튼
        if (shortsPrevBtn) {
            shortsPrevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                goToShorts(currentShortsIndex - 1);
            });
        }

        if (shortsNextBtn) {
            shortsNextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                goToShorts(currentShortsIndex + 1);
            });
        }

        // 하단 인디케이터 도트
        shortsDots.forEach((dot, idx) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                goToShorts(idx);
            });
        });

        // 화면 터치 오버레이: 영상 탭 시 재생/일시정지 토글 (유튜브 내부 UI 팝업 100% 방지)
        screenOverlays.forEach((overlay, idx) => {
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                const isMobile = window.innerWidth <= 768;
                if (isMobile && idx !== currentShortsIndex) {
                    goToShorts(idx);
                } else {
                    const card = shortsCards[idx];
                    const iframe = card.querySelector('iframe');
                    if (iframe) {
                        const isPaused = card.classList.toggle('is-paused');
                        postYtCommand(iframe, isPaused ? 'pauseVideo' : 'playVideo');
                    }
                }
            });
        });

        // 모바일 터치 스와이프: 세로 스크롤 시 오작동 100% 방지
        if (shortsSliderTrack) {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;

            shortsSliderTrack.addEventListener('touchstart', (e) => {
                if (e.changedTouches && e.changedTouches[0]) {
                    touchStartX = e.changedTouches[0].clientX;
                    touchStartY = e.changedTouches[0].clientY;
                }
            }, { passive: true });

            shortsSliderTrack.addEventListener('touchend', (e) => {
                if (e.changedTouches && e.changedTouches[0]) {
                    touchEndX = e.changedTouches[0].clientX;
                    touchEndY = e.changedTouches[0].clientY;
                    const diffX = touchEndX - touchStartX;
                    const diffY = touchEndY - touchStartY;

                    // 가로 이동이 60px 이상이고 세로 이동의 1.8배 이상일 때만 좌우 스와이프
                    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.8) {
                        if (diffX < 0) {
                            goToShorts(currentShortsIndex + 1);
                        } else {
                            goToShorts(currentShortsIndex - 1);
                        }
                    }
                }
            }, { passive: true });
        }

        // 뷰포트 진입 시 자동 재생 (IntersectionObserver)
        if ('IntersectionObserver' in window) {
            const shortsSectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        playShortsIndex(currentShortsIndex);
                    } else {
                        pauseShortsIndex(currentShortsIndex);
                    }
                });
            }, { threshold: 0.2 });

            shortsSectionObserver.observe(revealSectionEl);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRevealShorts);
    } else {
        initRevealShorts();
    }
})();
