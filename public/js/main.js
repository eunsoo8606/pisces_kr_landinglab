document.addEventListener('DOMContentLoaded', () => {
    // 1. Lenis Smooth Scroll 초기화
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // GSAP ScrollTrigger 연동
    gsap.registerPlugin(ScrollTrigger);

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // 2. 스크롤 시 헤더 상태 토글 (Scrolled)
    const headerElement = document.querySelector('header');
    if (headerElement) {
        const checkScroll = () => {
            if (window.scrollY > 50) {
                headerElement.classList.add('scrolled');
            } else {
                headerElement.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', checkScroll);
        checkScroll(); // 초기 상태 체크
    }

    // 3. 일체형 메가 메뉴 인터렉션 (GSAP)
    const megaMenu = document.querySelector('.mega-menu');
    const megaCols = document.querySelectorAll('.mega-col');

    if (megaMenu && headerElement) {
        headerElement.addEventListener('mouseenter', () => {
            gsap.to(megaMenu, {
                opacity: 1,
                visibility: 'visible',
                y: 0,
                duration: 0.5,
                ease: 'power3.out'
            });
            if (megaCols.length > 0) {
                gsap.fromTo(megaCols,
                    { opacity: 0, y: 15 },
                    { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out', delay: 0.1 }
                );
            }
        });

        headerElement.addEventListener('mouseleave', () => {
            gsap.to(megaMenu, {
                opacity: 0,
                visibility: 'hidden',
                y: -10,
                duration: 0.4,
                ease: 'power2.in'
            });
        });
    }

    // 4. 프리미엄 다크 히어로 섹션 등장 애니메이션 & 매출 카운트업
    const heroDarkSection = document.querySelector('.hero-dark');
    const heroSashimiImg = document.querySelector('.hero-sashimi-img');
    const heroLeft = document.querySelector('.hero-left');
    const heroRight = document.querySelector('.hero-right');
    const revenueNumEl = document.getElementById('revenueNum');

    if (heroLeft && heroRight) {
        const heroTimeline = gsap.timeline();

        // 1) 우측 하단 숙성회 이미지가 대각선 구석(x:50, y:50)에서 중심으로 웅장하게 페이드인하며 안착
        if (heroSashimiImg) {
            heroTimeline.fromTo(heroSashimiImg,
                { opacity: 0, x: 50, y: 50 },
                {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    duration: 2.0,
                    ease: 'power3.out'
                }
            );
        }

        // 2) 좌측 텍스트 정보 등장 (이미지 노출 중반부부터 겹쳐서 진행)
        heroTimeline.to(heroLeft, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out'
        }, '-=1.4');

        // 3) 우측 매출 정보 오버레이 등장
        heroTimeline.to(heroRight, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out'
        }, '-=0.9');

        // 4) 매출액 카운트업 롤링 애니메이션 연동
        if (revenueNumEl) {
            const countObj = { val: 0 };
            const targetVal = 98450000;

            heroTimeline.to(countObj, {
                val: targetVal,
                duration: 2.2,
                ease: 'power4.out',
                onUpdate: () => {
                    revenueNumEl.innerText = Math.floor(countObj.val).toLocaleString();
                },
                onComplete: () => {
                    // 카운트업 완료 시 강력한 골드/화이트 글로우 플래시 효과 트리거
                    revenueNumEl.classList.add('glow-active');
                    setTimeout(() => {
                        revenueNumEl.classList.remove('glow-active');
                    }, 1200);
                }
            }, '-=0.6');
        }

        // 5) 숙성회 이미지 마우스 인터랙티브 3D 패러랙스 (Mouse Parallax) 연동
        if (heroDarkSection && heroSashimiImg) {
            heroDarkSection.addEventListener('mousemove', (e) => {
                const { clientX, clientY } = e;
                // 마우스 위치에 따른 입체감 계산 (-20px ~ +20px 범위)
                const xPos = (clientX / window.innerWidth - 0.5) * 40;
                const yPos = (clientY / window.innerHeight - 0.5) * 40;

                gsap.to(heroSashimiImg, {
                    x: xPos,
                    y: yPos,
                    duration: 1.0,
                    ease: 'power2.out'
                });
            });

            heroDarkSection.addEventListener('mouseleave', () => {
                // 마우스가 화면을 떠나면 원위치로 부드럽게 복원
                gsap.to(heroSashimiImg, {
                    x: 0,
                    y: 0,
                    duration: 1.2,
                    ease: 'power3.out'
                });
            });
        }
    }

    // 5. 두 번째 섹션 (.section-quality) GSAP ScrollTrigger 진입 모션
    const sectionQuality = document.querySelector('.section-quality');
    const qualityLeft = document.querySelector('.quality-left');
    const qualityRight = document.querySelector('.quality-right');

    if (sectionQuality && qualityLeft && qualityRight) {
        gsap.timeline({
            scrollTrigger: {
                trigger: sectionQuality,
                start: 'top 80%', // 섹션 상단이 뷰포트 80%에 도달할 때
                toggleActions: 'play none none none',
            }
        })
            .to(qualityLeft, {
                opacity: 1,
                y: 0,
                duration: 1.0,
                ease: 'power3.out'
            })
            .to(qualityRight, {
                opacity: 1,
                y: 0,
                duration: 1.0,
                ease: 'power3.out'
            }, '-=0.7');
    }

    // 6. 퀄리티 섹션 우측 이미지 슬라이더 동작 제어
    const slides = document.querySelectorAll('.quality-slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentSlide = 0;
    let isTransitioning = false;

    if (slides.length > 0 && prevBtn && nextBtn) {
        const showSlide = (index) => {
            if (isTransitioning) return;
            isTransitioning = true;

            const activeSlide = document.querySelector('.quality-slide.active');
            const targetSlide = slides[index];

            if (activeSlide === targetSlide) {
                isTransitioning = false;
                return;
            }

            // GSAP을 통한 슬라이드 전환 연출
            const activeImg = activeSlide.querySelector('.slide-img img');
            const activeBadge = activeSlide.querySelector('.slide-badge');
            const activeTitle = activeSlide.querySelector('.slide-title');
            const activeDesc = activeSlide.querySelector('.slide-desc');

            const fadeOutTimeline = gsap.timeline();
            fadeOutTimeline.to([activeBadge, activeTitle, activeDesc], {
                opacity: 0,
                y: -15,
                duration: 0.3,
                stagger: 0.05,
                ease: 'power2.in'
            });

            gsap.to(activeSlide, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: () => {
                    activeSlide.classList.remove('active');
                    // 텍스트 위치 및 스케일 리셋
                    gsap.set([activeBadge, activeTitle, activeDesc], { y: 20, opacity: 0 });
                    if (activeImg) gsap.set(activeImg, { scale: 1 });

                    // 2) 신규 슬라이드 활성화
                    targetSlide.classList.add('active');

                    const targetImg = targetSlide.querySelector('.slide-img img');
                    const targetBadge = targetSlide.querySelector('.slide-badge');
                    const targetTitle = targetSlide.querySelector('.slide-title');
                    const targetDesc = targetSlide.querySelector('.slide-desc');

                    gsap.fromTo(targetSlide,
                        { opacity: 0 },
                        {
                            opacity: 1,
                            duration: 0.6,
                            ease: 'power2.inOut',
                            onComplete: () => {
                                isTransitioning = false;
                            }
                        }
                    );

                    // 신규 슬라이드 텍스트 솟아오르기 모션
                    gsap.fromTo([targetBadge, targetTitle, targetDesc],
                        { opacity: 0, y: 20 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.6,
                            stagger: 0.1,
                            ease: 'power3.out',
                            delay: 0.1
                        }
                    );
                }
            });
        };

        prevBtn.addEventListener('click', () => {
            if (isTransitioning) return;
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        });

        nextBtn.addEventListener('click', () => {
            if (isTransitioning) return;
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        });

        // 자동 롤링 재생 (5초 주기)
        let autoPlayTimer = setInterval(() => {
            nextBtn.click();
        }, 5000);

        // 사용자가 슬라이더 조작 시 롤링 타이머 갱신
        const resetAutoPlay = () => {
            clearInterval(autoPlayTimer);
            autoPlayTimer = setInterval(() => {
                nextBtn.click();
            }, 6000);
        };

        prevBtn.addEventListener('click', resetAutoPlay);
        nextBtn.addEventListener('click', resetAutoPlay);
    }


    // 8. 네 번째 섹션 (.section-price) GSAP ScrollTrigger 진입 모션 & 단가 카운트업
    const sectionPrice = document.querySelector('.section-price');
    const priceLeft = document.querySelector('.price-left');
    const priceRight = document.querySelector('.price-right');
    const tablePriceNumEl = document.getElementById('tablePriceNum');
    const tablePriceGlowEl = document.getElementById('tablePriceGlow');
    const priceImgWrapImg = document.querySelector('.price-img-wrap img');

    if (sectionPrice && priceLeft && priceRight) {
        const priceTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: sectionPrice,
                start: 'top 75%', // 섹션 상단이 뷰포트 75% 도달 시
                toggleActions: 'play none none none',
            }
        });

        priceTimeline.to(priceLeft, {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: 'power3.out'
        })
            .to(priceRight, {
                opacity: 1,
                y: 0,
                duration: 1.0,
                ease: 'power3.out'
            }, '-=0.7');

        // 단가 카운트업 롤링 (0 -> 10)
        if (tablePriceNumEl) {
            const priceCountObj = { val: 0 };
            priceTimeline.to(priceCountObj, {
                val: 10,
                duration: 1.6,
                ease: 'power3.out',
                onUpdate: () => {
                    tablePriceNumEl.innerText = Math.floor(priceCountObj.val);
                },
                onComplete: () => {
                    if (tablePriceGlowEl) {
                        tablePriceGlowEl.classList.add('glow-active');
                        setTimeout(() => {
                            tablePriceGlowEl.classList.remove('glow-active');
                        }, 1200);
                    }
                }
            }, '-=0.5');
        }

        // 우측 음식 이미지 마우스 입체 3D 패러랙스 연동
        if (priceImgWrapImg) {
            sectionPrice.addEventListener('mousemove', (e) => {
                const { clientX, clientY } = e;
                // 미세한 깊이 반응 (-15px ~ +15px 범위)
                const xPos = (clientX / window.innerWidth - 0.5) * 30;
                const yPos = (clientY / window.innerHeight - 0.5) * 30;

                gsap.to(priceImgWrapImg, {
                    x: xPos,
                    y: yPos,
                    duration: 0.8,
                    ease: 'power2.out'
                });
            });

            sectionPrice.addEventListener('mouseleave', () => {
                gsap.to(priceImgWrapImg, {
                    x: 0,
                    y: 0,
                    duration: 1.0,
                    ease: 'power3.out'
                });
            });
        }
    }

    // 9. 다섯 번째 섹션 (.section-hours) GSAP ScrollTrigger 진입 모션 & 3D 틸트 호버
    const sectionHours = document.querySelector('.section-hours');
    const hoursSubtitle = document.querySelector('.hours-subtitle');
    const hoursCardsWrap = document.querySelector('.hours-cards-wrap');
    const floatWraps = document.querySelectorAll('.hours-card-float-wrap');
    const hoursCards = document.querySelectorAll('.hours-card');
    const hoursTitle = document.querySelector('.hours-title');
    const hoursDesc = document.querySelector('.hours-desc');

    if (sectionHours && hoursSubtitle && hoursCardsWrap && hoursTitle && hoursDesc) {
        const hoursTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: sectionHours,
                start: 'top 75%', // 섹션 상단이 뷰포트 75% 도달 시
                toggleActions: 'play none none none',
            }
        });

        hoursTimeline.to(hoursSubtitle, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        })
            // 3개 카드가 차례대로 날아오듯 바운스되며 등장 (Stagger)
            .fromTo(floatWraps,
                { opacity: 0, y: 50, scale: 0.85, rotateX: -15 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotateX: 0,
                    duration: 1.2,
                    stagger: 0.15,
                    ease: 'back.out(1.4)',
                    clearProps: 'transform', // 3D 틸트 호버와 CSS가 충돌하지 않도록 트랜스폼 클리어
                    onStart: () => {
                        gsap.set(hoursCardsWrap, { opacity: 1, y: 0 });
                    },
                    onComplete: () => {
                        // 등장 완료 후 앰비언트 부유(Floating) 루프 비활성화
                        /*
                        floatWraps.forEach((wrap, index) => {
                            gsap.to(wrap, {
                                y: '+=10',
                                duration: 2.2 + index * 0.4,
                                repeat: -1,
                                yoyo: true,
                                ease: 'sine.inOut',
                                delay: index * 0.2
                            });
                        });
                        */
                    }
                },
                '-=0.5'
            )
            .to([hoursTitle, hoursDesc], {
                opacity: 1,
                y: 0,
                duration: 1.0,
                stagger: 0.2,
                ease: 'power3.out'
            }, '-=0.6');

        // 개별 카드 자동 3D 홀로그램 루프 비활성화 (기우뚱거리는 3D 틸트 제거)
        /*
        hoursCards.forEach((card, index) => {
            const bgImg = card.querySelector('.card-bg-img img');
            const content = card.querySelector('.card-content');

            // 애니메이션 상태 객체
            const state = { rx: 0, ry: 0, shineX: 20, shineY: 20 };

            gsap.timeline({ repeat: -1, yoyo: true })
                .to(state, {
                    rx: 8,
                    ry: -8,
                    shineX: 80,
                    shineY: 80,
                    duration: 3.2 + index * 0.4,
                    ease: 'sine.inOut',
                    delay: index * 0.3,
                    onUpdate: () => {
                        const rect = card.getBoundingClientRect();
                        const w = rect.width || 380;
                        const h = rect.height || 250;

                        // 1) 3D 카드 틸팅
                        gsap.set(card, {
                            rotateX: state.rx,
                            rotateY: state.ry
                        });

                        // 2) 반사광 좌표 실시간 주입
                        card.style.setProperty('--mouse-x', `${(state.shineX / 100) * w}px`);
                        card.style.setProperty('--mouse-y', `${(state.shineY / 100) * h}px`);

                        // 3) 배경 이미지와 텍스트의 3D 패러랙스 연동 (정방향/역방향)
                        if (bgImg) {
                            gsap.set(bgImg, {
                                x: -state.ry * 1.5,
                                y: state.rx * 1.5,
                                scale: 1.08
                            });
                        }
                        if (content) {
                            gsap.set(content, {
                                x: state.ry * 1.2,
                                y: -state.rx * 1.2,
                                z: 40
                            });
                        }
                    }
                });
        });
        */
    }

    // 10. 여섯 번째 섹션 (.section-model) GSAP ScrollTrigger 진입 모션
    const sectionModel = document.querySelector('.section-model');
    const modelSubtitle = document.querySelector('.model-subtitle');
    const modelTitle = document.querySelector('.model-title');
    const modelDesc = document.querySelector('.model-desc');
    const modelCards = document.querySelectorAll('.model-card');
    const modelCardContents = document.querySelectorAll('.model-card-content');

    if (sectionModel && modelSubtitle && modelTitle && modelDesc && modelCards.length > 0) {
        const modelTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: sectionModel,
                start: 'top 75%', // 섹션 상단이 뷰포트 75% 도달 시
                toggleActions: 'play none none none',
            }
        });

        // 헤더 텍스트 순차 등장
        modelTimeline.fromTo([modelSubtitle, modelTitle, modelDesc],
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 1.0,
                stagger: 0.15,
                ease: 'power3.out'
            }
        )
            // 3단 카드 커튼 와이프 (clip-path) 등장
            .fromTo(modelCards,
                { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
                {
                    clipPath: 'inset(0% 0 0 0)',
                    opacity: 1,
                    duration: 1.4,
                    stagger: 0.25,
                    ease: 'power3.inOut'
                },
                '-=0.6'
            )
            // 카드 내부 글자(번호/타이틀) 솟아오름
            .fromTo(modelCardContents,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: 'power2.out'
                },
                '-=1.0'
            );
    }

    // 11. 일곱 번째 섹션 (.section-growth) GSAP ScrollTrigger 진입 모션
    const sectionGrowth = document.querySelector('.section-growth');
    const growthTitleWrap = document.querySelector('.growth-title-wrap');
    const lineProgress = document.querySelector('.timeline-line-progress');
    const progressLineSvg = document.querySelector('.timeline-line-progress-svg');
    const glowParticleSvg = document.querySelector('.timeline-glow-particle-svg');
    const timelineNodes = document.querySelectorAll('.timeline-node');

    if (sectionGrowth && growthTitleWrap && timelineNodes.length > 0) {
        const growthTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: sectionGrowth,
                start: 'top 75%', // 섹션 상단이 뷰포트 75% 도달 시
                toggleActions: 'play none none none',
            }
        });

        // 1) 성장사 타이틀 등장
        growthTimeline.fromTo(growthTitleWrap,
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 1.0,
                ease: 'power3.out'
            }
        );

        // 2) 해상도별 가로/세로 타임라인 선 그리기(Draw-in) 및 노드 팝업
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            if (lineProgress) {
                growthTimeline.fromTo(lineProgress,
                    { scaleY: 0 },
                    {
                        scaleY: 1,
                        duration: 1.5,
                        ease: 'power2.inOut'
                    },
                    '-=0.5'
                );
            }
        } else {
            // 데스크톱: SVG 굴곡 곡선 선 그리기 (dashoffset 애니메이션)
            if (progressLineSvg) {
                // 디스플레이 none 상태에서 0이 반환되는 문제를 막기 위해 3000px 고정값 지정
                const pathLength = 3000;
                // 초기 대기 상태의 dasharray와 dashoffset을 정밀 매칭
                gsap.set(progressLineSvg, {
                    strokeDasharray: pathLength,
                    strokeDashoffset: pathLength
                });

                growthTimeline.fromTo(progressLineSvg,
                    { strokeDashoffset: pathLength },
                    {
                        strokeDashoffset: 0,
                        duration: 1.6,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            // 선 드로잉 완료 후, 빛 파티클 곡선 이동 애니메이션 무한 루프 활성화
                            if (glowParticleSvg) {
                                gsap.timeline({ repeat: -1 })
                                    .fromTo(glowParticleSvg,
                                        { offsetDistance: "0%", opacity: 0 },
                                        {
                                            offsetDistance: "100%",
                                            opacity: 1,
                                            duration: 4.0,
                                            ease: 'power1.inOut'
                                        }
                                    )
                                    .to(glowParticleSvg, { opacity: 0, duration: 0.3 }, "-=0.3");
                            }
                        }
                    },
                    '-=0.5'
                );
            }
        }

        // 3) 노드 순차 팝업 (Stagger)
        // 스크롤 시 선과 점이 어긋나는 현상을 영구 차단하기 위해 Y축 위치 이동(yPercent)을 배제하고
        // opacity와 scale 팝업으로만 모션을 정갈하게 처리합니다.
        growthTimeline.fromTo(timelineNodes,
            { opacity: 0, scale: 0.7 },
            {
                opacity: 1,
                scale: 1,
                duration: 0.8,
                stagger: 0.25,
                ease: 'back.out(1.5)'
            },
            '-=1.2'
        );
    }

    // 12. 여덟 번째 섹션 (.section-ranking) 매출 데이터 및 전광판 오토 롤링 인터렉션
    const sectionRanking = document.querySelector('.section-ranking');
    const rankingHeader = document.querySelector('.ranking-header');
    const rankingSelectorWrap = document.querySelector('.ranking-selector-wrap');
    const rankingBoardWrap = document.querySelector('.ranking-board-wrap');
    const monthTabs = document.querySelectorAll('.month-tab');
    const rankingRowsContainer = document.getElementById('rankingRows');

    if (sectionRanking && rankingHeader && rankingSelectorWrap && rankingBoardWrap && monthTabs.length > 0 && rankingRowsContainer) {
        // 12개월분 가상의 최고 매출 데이터셋
        const rankingData = {
            1: [
                { branch: "평택고덕점", sales: "6,400,000원" },
                { branch: "잠실점", sales: "5,880,000원" },
                { branch: "야탑점", sales: "5,620,000원" },
                { branch: "강남점", sales: "5,350,000원" },
                { branch: "상암점", sales: "5,020,000원" }
            ],
            2: [
                { branch: "강남점", sales: "6,850,000원" },
                { branch: "논현점", sales: "6,300,000원" },
                { branch: "평택고덕점", sales: "5,950,000원" },
                { branch: "잠실점", sales: "5,720,000원" },
                { branch: "사당점", sales: "5,220,000원" }
            ],
            3: [
                { branch: "평택고덕점", sales: "7,120,000원" },
                { branch: "강남점", sales: "6,450,000원" },
                { branch: "야탑점", sales: "5,800,000원" },
                { branch: "구로디지털점", sales: "5,450,000원" },
                { branch: "잠실점", sales: "5,250,000원" }
            ],
            4: [
                { branch: "잠실점", sales: "6,920,000원" },
                { branch: "논현점", sales: "6,520,000원" },
                { branch: "평택고덕점", sales: "6,120,000원" },
                { branch: "가락점", sales: "5,680,000원" },
                { branch: "상암점", sales: "5,180,000원" }
            ],
            5: [
                { branch: "강남점", sales: "7,420,000원" },
                { branch: "평택고덕점", sales: "6,850,000원" },
                { branch: "잠실점", sales: "6,200,000원" },
                { branch: "야탑점", sales: "5,850,000원" },
                { branch: "사당점", sales: "5,380,000원" }
            ],
            6: [
                { branch: "평택고덕점", sales: "7,250,000원" },
                { branch: "논현점", sales: "6,650,000원" },
                { branch: "구로디지털점", sales: "6,100,000원" },
                { branch: "가락점", sales: "5,750,000원" },
                { branch: "상암점", sales: "5,200,000원" }
            ],
            7: [
                { branch: "잠실점", sales: "7,380,000원" },
                { branch: "강남점", sales: "6,720,000원" },
                { branch: "야탑점", sales: "6,150,000원" },
                { branch: "평택고덕점", sales: "5,880,000원" },
                { branch: "사당점", sales: "5,420,000원" }
            ],
            8: [
                { branch: "강남점", sales: "7,550,000원" },
                { branch: "평택고덕점", sales: "6,920,000원" },
                { branch: "논현점", sales: "6,400,000원" },
                { branch: "잠실점", sales: "5,980,000원" },
                { branch: "가락점", sales: "5,520,000원" }
            ],
            9: [
                { branch: "평택고덕점", sales: "7,180,000원" },
                { branch: "야탑점", sales: "6,520,000원" },
                { branch: "상암점", sales: "6,050,000원" },
                { branch: "사당점", sales: "5,620,000원" },
                { branch: "잠실점", sales: "5,300,000원" }
            ],
            10: [
                { branch: "강남점", sales: "7,280,000원" },
                { branch: "논현점", sales: "6,620,000원" },
                { branch: "평택고덕점", sales: "6,280,000원" },
                { branch: "가락점", sales: "5,820,000원" },
                { branch: "구로디지털점", sales: "5,350,000원" }
            ],
            11: [
                { branch: "잠실점", sales: "6,980,000원" },
                { branch: "평택고덕점", sales: "6,420,000원" },
                { branch: "야탑점", sales: "5,920,000원" },
                { branch: "강남점", sales: "5,580,000원" },
                { branch: "사당점", sales: "5,150,000원" }
            ],
            12: [
                { branch: "평택고덕점", sales: "7,620,000원" },
                { branch: "강남점", sales: "7,120,000원" },
                { branch: "잠실점", sales: "6,580,000원" },
                { branch: "논현점", sales: "6,080,000원" },
                { branch: "상암점", sales: "5,650,000원" }
            ]
        };

        let currentActiveMonth = 1;
        let rollingInterval = null;

        // 특정 월의 순위 데이터 렌더링 및 애니메이션 수행 함수
        const updateRankBoard = (month, isManual = false) => {
            const data = rankingData[month];
            if (!data) return;

            // 탭 활성화 상태 동기화
            monthTabs.forEach(tab => {
                if (parseInt(tab.getAttribute('data-month')) === month) {
                    tab.classList.add('active');
                    // 모바일 해상도에서 사용자가 직접 클릭(수동)한 경우에만 활성화된 탭을 중앙으로 스크롤 정렬
                    if (isManual && window.innerWidth <= 768) {
                        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                } else {
                    tab.classList.remove('active');
                }
            });

            currentActiveMonth = month;

            // 1) 기존 리스트 싹 가라앉히며 페이드아웃
            gsap.to(".ranking-row", {
                opacity: 0,
                y: -15,
                duration: 0.35,
                stagger: 0.05,
                ease: 'power2.in',
                onComplete: () => {
                    // 2) 신규 데이터 HTML 바인딩
                    rankingRowsContainer.innerHTML = data.map((item, idx) => {
                        const rankNum = idx + 1;
                        const rankClass = rankNum === 1 ? 'rank-1st' : '';
                        return `
                            <div class="ranking-row ${rankClass}">
                                <div class="col-rank">${rankNum}위</div>
                                <div class="col-branch">${item.branch}</div>
                                <div class="col-sales">${item.sales}</div>
                            </div>
                        `;
                    }).join('');

                    // 3) 신규 리스트 아래에서 위로 솟아오르며 페이드인 등장 (전광판 롤링 연출)
                    gsap.fromTo(".ranking-row",
                        { opacity: 0, y: 20 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.55,
                            stagger: 0.08,
                            ease: 'power2.out'
                        }
                    );
                }
            });

            // 수동 클릭 시 오토 롤링 타이머 갱신
            if (isManual) {
                resetAutoRolling();
            }
        };

        // 오토 롤링 작동 관리 함수 (5초 주기)
        const startAutoRolling = () => {
            if (rollingInterval) clearInterval(rollingInterval);
            rollingInterval = setInterval(() => {
                let nextMonth = currentActiveMonth + 1;
                if (nextMonth > 12) nextMonth = 1;
                updateRankBoard(nextMonth);
            }, 5000);
        };

        const resetAutoRolling = () => {
            clearInterval(rollingInterval);
            startAutoRolling();
        };

        // 탭 클릭 수동 리스너 바인딩
        monthTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const month = parseInt(tab.getAttribute('data-month'));
                updateRankBoard(month, true);
            });
        });

        // 년도 드롭다운 변경 리스너 바인딩
        const yearSelect = document.getElementById('yearSelect');
        if (yearSelect) {
            yearSelect.addEventListener('change', () => {
                updateRankBoard(1, true);
            });
        }

        // 4) GSAP ScrollTrigger 진입 모션
        const rankTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRanking,
                start: 'top 75%',
                toggleActions: 'play none none none',
                onEnter: () => {
                    // 최초 진입 시점에 1월 렌더링 및 오토 롤링 활성화
                    updateRankBoard(1);
                    startAutoRolling();
                }
            }
        });

        rankTimeline.fromTo(rankingHeader,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }
        )
            .fromTo(rankingSelectorWrap,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
                '-=0.7'
            )
            .fromTo(rankingBoardWrap,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' },
                '-=0.7'
            );
    }

    // 개설비용 섹션 (.section-cost) GSAP ScrollTrigger 진입 모션
    const sectionCost = document.querySelector('.section-cost');
    const costHeader = document.querySelector('.cost-header');
    const costTableWrap = document.querySelector('.cost-table-wrap');
    const costRows = document.querySelectorAll('.cost-table tbody tr');
    const costTotalRow = document.querySelector('.row-total');
    const costNotice = document.querySelector('.cost-notice');

    if (sectionCost && costHeader && costTableWrap) {
        const costTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: sectionCost,
                start: 'top 75%',
                toggleActions: 'play none none none'
            }
        });

        // 1) 헤더 페이드인
        costTimeline.to(costHeader, {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: 'power3.out'
        })
            // 2) 테이블 래퍼 등장
            .to(costTableWrap, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.5')
            // 3) 테이블 행 순차 등장
            .fromTo(costRows,
                { opacity: 0, x: -20 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.5,
                    stagger: 0.08,
                    ease: 'power2.out'
                },
                '-=0.4'
            );

        // 4) 합계 행 강조 등장
        if (costTotalRow) {
            costTimeline.fromTo(costTotalRow,
                { opacity: 0, scale: 0.95 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.6,
                    ease: 'back.out(1.3)'
                },
                '-=0.2'
            );
        }

        // 5) 하단 안내 문구
        if (costNotice) {
            costTimeline.fromTo(costNotice,
                { opacity: 0 },
                { opacity: 1, duration: 0.5 },
                '-=0.3'
            );
        }
    }

    // 13. 아홉 번째 섹션 (.section-fillet) GSAP ScrollTrigger 진입 모션 & 3D 마우스 패러랙스
    const sectionFillet = document.querySelector('.section-fillet');
    const filletHeader = document.querySelector('.fillet-header');
    const filletImageWrap = document.querySelector('.fillet-image-wrap');
    const filletChefImg = document.querySelector('.fillet-chef-img');
    const filletCards = document.querySelector('.fillet-cards');

    if (sectionFillet && filletHeader && filletImageWrap && filletCards) {
        const filletTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: sectionFillet,
                start: 'top 75%', // 섹션 상단이 뷰포트 75% 도달 시
                toggleActions: 'play none none none'
            }
        });

        // 1) 헤더 등장
        filletTimeline.to(filletHeader, {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: 'power3.out'
        })
            // 2) 중앙 이미지 웅장하게 확대 등장
            .to(filletImageWrap, {
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: 'power4.out'
            }, '-=0.6')
            // 3) 하단 카드 대칭형 페이드인 등장 (stagger)
            .to(filletCards, {
                opacity: 1,
                y: 0,
                duration: 1.0,
                ease: 'power3.out'
            }, '-=0.7');
    }

    // 14. 열 번째 섹션 (.section-factory) GSAP ScrollTrigger 진입 모션 & 자석 겹침 애니메이션
    const sectionFactory = document.querySelector('.section-factory');
    const factoryHeader = document.querySelector('.factory-header');
    const cardOther = document.querySelector('.card-other');
    const cardPisces = document.querySelector('.card-pisces');
    const starDecor = document.querySelector('.star-decor');

    if (sectionFactory && factoryHeader && cardOther && cardPisces) {
        const isMobile = window.innerWidth <= 768;
        const factoryTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: sectionFactory,
                start: 'top 75%', // 섹션 상단이 뷰포트 75% 도달 시
                toggleActions: 'play none none none'
            }
        });

        // 1) 헤더 타이틀 및 설명 등장
        factoryTimeline.fromTo(factoryHeader,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }
        );

        if (isMobile) {
            // 모바일: 위아래로 더 멀어졌다가 세로로 포개지며 겹쳐지는 모션
            factoryTimeline.fromTo(cardOther,
                { opacity: 0, y: -80 },
                { opacity: 1, y: 15, duration: 1.2, ease: 'power4.out' },
                '-=0.7'
            )
                .fromTo(cardPisces,
                    { opacity: 0, y: 80 },
                    { opacity: 1, y: -15, duration: 1.2, ease: 'power4.out' },
                    '-=1.0'
                );
        } else {
            // 데스크톱/태블릿: 좌우로 멀어지고 회전되어 있다가 중심으로 슥 끌어당겨지며 착 포개지는 모션
            // card-other의 최종 x값(25)과 card-pisces의 최종 x값(-25)을 주어 오버랩되도록 연출합니다.
            const targetOtherX = window.innerWidth <= 1024 ? 20 : 25;
            const targetPiscesX = window.innerWidth <= 1024 ? -20 : -25;

            factoryTimeline.fromTo(cardOther,
                { opacity: 0, x: -140, rotate: -4 },
                { opacity: 1, x: targetOtherX, rotate: 0, duration: 1.2, ease: 'power4.out' },
                '-=0.7'
            )
                .fromTo(cardPisces,
                    { opacity: 0, x: 140, rotate: 4 },
                    { opacity: 1, x: targetPiscesX, rotate: 0, duration: 1.2, ease: 'power4.out' },
                    '-=1.0'
                );
        }

        // 2) 카드가 다 안착된 후, 물고기자리 카드 위의 빨간 별표가 스프링 바운스로 팝업
        if (starDecor) {
            factoryTimeline.fromTo(starDecor,
                { scale: 0, opacity: 0, rotate: -30 },
                {
                    scale: 1,
                    opacity: 1,
                    rotate: 12,
                    duration: 0.8,
                    ease: 'back.out(1.8)'
                },
                '-=0.4'
            );
        }
    }

    // 15. 열한 번째 섹션 (.section-process) GSAP ScrollTrigger 진입 모션
    const sectionProcess = document.querySelector('.section-process');
    const processCols = document.querySelectorAll('.process-col');

    if (sectionProcess && processCols.length > 0) {
        gsap.fromTo(processCols,
            { opacity: 0, y: 60 },
            {
                opacity: 1,
                y: 0,
                duration: 1.2,
                stagger: 0.25,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: sectionProcess,
                    start: 'top 75%', // 섹션 상단이 뷰포트 75% 도달 시
                    toggleActions: 'play none none none'
                }
            }
        );
    }
    // 16. 열두 번째 섹션 (.section-competitiveness) 가로형 아코디언 인터랙션 + GSAP 진입 모션
    const compSection = document.querySelector('.section-competitiveness');
    const accordionItems = document.querySelectorAll('#compAccordion .accordion-item');

    if (compSection && accordionItems.length > 0) {
        // 모바일 여부 감지 (768px 이하)
        const isMobile = () => window.innerWidth <= 768;

        // active 클래스를 클릭/호버된 아이템으로 이동시키는 함수
        const activateItem = (targetItem) => {
            accordionItems.forEach(item => item.classList.remove('active'));
            targetItem.classList.add('active');
        };

        accordionItems.forEach(item => {
            // 데스크톱: hover로 아코디언 열기
            item.addEventListener('mouseenter', () => {
                if (!isMobile()) {
                    activateItem(item);
                }
            });

            // 모바일: click으로 토글 (클릭한 아이템이 이미 active면 닫지 않고 유지)
            item.addEventListener('click', () => {
                if (isMobile()) {
                    activateItem(item);
                }
            });
        });

        // GSAP ScrollTrigger: 섹션 진입 시 헤더 + 아코디언 페이드인
        const compHeader = compSection.querySelector('.comp-header');
        const compAccordion = compSection.querySelector('.comp-accordion');

        if (compHeader) {
            gsap.fromTo(compHeader,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.0,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: compSection,
                        start: 'top 75%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }

        if (compAccordion) {
            gsap.fromTo(compAccordion,
                { opacity: 0, y: 70, scale: 0.97 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 1.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: compSection,
                        start: 'top 65%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }
    }

    // 17. 열세 번째 섹션 (.section-menu) 탭 인터랙션 + GSAP 카드 등장
    const menuSection = document.querySelector('.section-menu');
    const menuTabBtns = document.querySelectorAll('.menu-tab-btn');
    const menuPanels = document.querySelectorAll('.menu-panel');

    if (menuSection && menuTabBtns.length > 0) {

        // 탭 전환: 카드들이 순차 페이드인 (탄력적 back.out 모션 적용)
        const switchMenuTab = (targetTab) => {
            menuTabBtns.forEach(btn => btn.classList.remove('active'));
            menuPanels.forEach(panel => {
                panel.classList.remove('active');
                gsap.killTweensOf(panel);
                gsap.killTweensOf(panel.querySelectorAll('.menu-card'));
            });

            const activeBtn = document.querySelector(`.menu-tab-btn[data-tab="${targetTab}"]`);
            const activePanel = document.querySelector(`.menu-panel[data-panel="${targetTab}"]`);

            if (activeBtn) activeBtn.classList.add('active');
            if (activePanel) {
                activePanel.classList.add('active');
                const cards = activePanel.querySelectorAll('.menu-card');

                // 패널 페이드인
                gsap.fromTo(activePanel,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.35, ease: 'power2.out' }
                );

                // 개별 카드 순차적 탄성 점프 효과
                gsap.fromTo(cards,
                    { opacity: 0, y: 35, scale: 0.95 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.08, ease: 'back.out(1.3)' }
                );
            }
        };

        menuTabBtns.forEach(btn => {
            btn.addEventListener('click', () => switchMenuTab(btn.dataset.tab));
        });

        // 섹션 진입 애니메이션: 타이틀은 좌측에서, 탭 메뉴는 우측에서 부드럽게 진입
        gsap.fromTo(menuSection.querySelectorAll('.menu-editorial-title > *'),
            { opacity: 0, x: -45 },
            {
                opacity: 1, x: 0, duration: 0.95, stagger: 0.12, ease: 'power3.out',
                scrollTrigger: { trigger: menuSection, start: 'top 75%', toggleActions: 'play none none none' }
            }
        );
        gsap.fromTo(menuSection.querySelector('.menu-tabs'),
            { opacity: 0, x: 45 },
            {
                opacity: 1, x: 0, duration: 0.95, ease: 'power3.out',
                scrollTrigger: { trigger: menuSection, start: 'top 75%', toggleActions: 'play none none none' }
            }
        );

        // 그리드 카드들 순차적 튕김 모션
        const initCards = menuSection.querySelectorAll('.menu-panel.active .menu-card');
        gsap.fromTo(initCards,
            { opacity: 0, y: 35, scale: 0.95 },
            {
                opacity: 1, y: 0, scale: 1, duration: 0.75, stagger: 0.09, ease: 'back.out(1.3)',
                scrollTrigger: { trigger: menuSection, start: 'top 60%', toggleActions: 'play none none none' }
            }
        );

        // 하단 더보기 버튼 페이드 업 진입
        gsap.fromTo(menuSection.querySelector('.menu-more-action'),
            { opacity: 0, y: 25 },
            {
                opacity: 1, y: 0, duration: 0.85, ease: 'power2.out',
                scrollTrigger: { trigger: menuSection, start: 'top 80%', toggleActions: 'play none none none' }
            }
        );
    }

    const storeItems = document.querySelectorAll('.store-item');
    let currentStoreIdx = 0;

    // 2. 매장별 정보 순환 트랜지션 함수
    function nextStore() {
        const currentItem = storeItems[currentStoreIdx];
        currentStoreIdx = (currentStoreIdx + 1) % storeItems.length;
        const nextItem = storeItems[currentStoreIdx];
        const nextData = nextItem.dataset; // data-* 속성 데이터 가져오기

        const sliderTl = gsap.timeline();

        // A. 현재 반투명 스태츠 카드가 왼쪽으로 비켜나며 사라짐
        sliderTl.to('.store-status-card', {
            opacity: 0,
            x: -30,
            duration: 0.5,
            ease: 'power2.in',
            onComplete: () => {
                // 완전히 사라진 순간 HTML 데이터를 다음 매장 내용으로 바꿈
                document.getElementById('storeName').innerText = nextData.store;
                document.getElementById('storeSize').innerText = nextData.size;
                document.getElementById('storeTable').innerText = nextData.table;
                document.getElementById('storeSales').innerText = nextData.sales;
            }
        });

        // B. 슬라이더 배경 실내 이미지 크로스페이드 교체
        sliderTl.to(currentItem, { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, 0);
        sliderTl.to(nextItem, { opacity: 1, duration: 0.8, ease: 'power2.inOut' }, 0);

        // C. 변경된 정보 카드가 부드러운 탄성(Back) 효과와 함께 다시 등장
        sliderTl.to('.store-status-card', {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: 'back.out(1.7)'
        }, '+=0.1');
    }

    // 매장 데이터가 존재하면 5초마다 자동 트랜지션 실행
    if (storeItems.length > 0) {
        setInterval(nextStore, 5000);
    }

    // 3. 스크롤 진입 시 좌우 날개(Left/Right Wing) 대칭 슬라이딩 애니메이션
    gsap.from('.sales-dashboard .left-wing', {
        xPercent: -20,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.sales-dashboard',
            start: 'top 80%'
        }
    });

    gsap.from('.sales-dashboard .right-wing', {
        xPercent: 20,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.sales-dashboard',
            start: 'top 80%'
        }
    });

    // 서클 마스크 리빌 & 숏츠 컨텐츠 순차 페이드 타임라인 정의
    const revealTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: '.reveal-section',
            start: 'top top',
            end: '+=200%', // 스크롤바 높이를 강제로 약 2배 넓혀 고정시간(Pinned) 확보
            scrub: 1,      // 스크롤바 이동 속도와 애니메이션 프레임을 1:1로 정밀 정합(부드러운 스크럽)
            pin: true,     // 마스크가 완전히 다 넓어질 때까지 뷰포트를 화면에 고정시킴
            anticipatePin: 1
        }
    });

    revealTimeline
        // 1. 위에 덮인 이미지의 마스크 원을 화면 밖(150% 크기)으로 확장하여 내부 숏츠 노출
        .to('.reveal-overlay', {
            clipPath: 'circle(150% at 50% 50%)',
            duration: 2,
            ease: 'none'
        })
        // 2. 마스크가 팽창함과 동시에 내부 숏츠 래퍼 드러내기 및 활성화
        .to('.shorts-container', {
            opacity: 1,
            pointerEvents: 'auto', // 완전 등장 시 비디오 클릭 가능하도록 처리
            duration: 1,
            ease: 'power2.out'
        }, '-=1') // 전체 타임라인상 마스크가 거의 다 커져가는 시점(-1초)에 겹침 시작
        // 3. 숏츠 비디오 카드들이 위에서 아래로 미끄러지며 정렬 (Stagger)
        .to('.shorts-card', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.15,
            ease: 'expo.out'
        }, '-=0.5')
        // 4. 우측 정보 타이틀과 수치 텍스트가 오른쪽에서 왼쪽으로 솟아나며 등장
        .to(['.shorts-title', '.shorts-metrics'], {
            opacity: 1,
            x: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power2.out'
        }, '-=0.8');
    // 5. 창업 상담 신청 문의하기 (Inquiry Form) 핸들링

    // 이메일 도메인 자동 선택/직접입력 토글 로직
    const emailDomainSelect = document.getElementById('emailDomainSelect');
    const inquirerEmailDomain = document.getElementById('inquirerEmailDomain');

    if (emailDomainSelect && inquirerEmailDomain) {
        emailDomainSelect.addEventListener('change', function() {
            const selectedVal = this.value;
            if (selectedVal === "") {
                // 직접 입력 선택 시
                inquirerEmailDomain.value = "";
                inquirerEmailDomain.readOnly = false;
                inquirerEmailDomain.focus();
            } else {
                // 도메인 선택 시 자동 입력 및 수정 불가 처리
                inquirerEmailDomain.value = selectedVal;
                inquirerEmailDomain.readOnly = true;
            }
        });
    }

    // GSAP ScrollTrigger 문의하기 섹션 등장 애니메이션
    if (document.querySelector('.section-inquiry')) {
        gsap.fromTo('.inquiry-header > *', 
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                stagger: 0.15,
                duration: 1.0,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.section-inquiry',
                    start: 'top 80%'
                }
            }
        );

        gsap.to('.inquiry-form-card', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power4.out',
            scrollTrigger: {
                trigger: '.inquiry-form-card',
                start: 'top 85%'
            }
        });
    }

    // 폼 유효성 검사 및 전송 연출
    const inquiryForm = document.getElementById('inquiryForm');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // 필드 선택
            const nameInput = document.getElementById('inquirerName');
            const phoneInput = document.getElementById('inquirerPhone');
            const emailIdInput = document.getElementById('inquirerEmailId');
            const emailDomainInput = document.getElementById('inquirerEmailDomain');
            const addressInput = document.getElementById('inquirerAddress');
            const privacyAgree = document.getElementById('privacyAgree');
            const submitBtn = this.querySelector('.btn-submit');

            // 1) 이름 유효성 검사
            if (!nameInput.value.trim()) {
                alert('성함을 입력해 주세요.');
                nameInput.focus();
                return;
            }

            // 2) 연락처 유효성 검사
            const phoneVal = phoneInput.value.trim();
            if (!phoneVal) {
                alert('연락처를 입력해 주세요.');
                phoneInput.focus();
                return;
            }
            // 하이픈 제거 또는 포맷 정규식 (기본적인 모바일 전화번호 형태 검증)
            const phoneReg = /^(01[016789]{1}|02|0[3-9]{1}[0-9]{1})-[0-9]{3,4}-[0-9]{4}$/;
            const phoneRegNoHyphen = /^(01[016789]{1}|02|0[3-9]{1}[0-9]{1})[0-9]{3,4}[0-9]{4}$/;
            if (!phoneReg.test(phoneVal) && !phoneRegNoHyphen.test(phoneVal)) {
                alert('올바른 연락처 형식을 입력해 주세요. (예: 010-1234-5678 또는 하이픈 없이 입력)');
                phoneInput.focus();
                return;
            }

            // 3) 이메일 유효성 검사
            if (!emailIdInput.value.trim()) {
                alert('이메일 아이디를 입력해 주세요.');
                emailIdInput.focus();
                return;
            }
            if (!emailDomainInput.value.trim()) {
                alert('이메일 도메인을 입력해 주세요.');
                emailDomainInput.focus();
                return;
            }

            // 4) 거주지 유효성 검사
            if (!addressInput.value.trim()) {
                alert('거주지를 입력해 주세요.');
                addressInput.focus();
                return;
            }

            // 5) 개인정보 동의 유효성 검사
            if (!privacyAgree.checked) {
                alert('개인정보 수집 및 이용에 동의해 주세요.');
                privacyAgree.focus();
                return;
            }

            // 제출 진행 연출 (제출 완료 애니메이션)
            if (submitBtn) {
                const origBtnHtml = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span>상담 신청을 전송 중입니다...</span>`;
                submitBtn.style.opacity = '0.8';

                setTimeout(() => {
                    alert('성공적으로 창업 상담 신청이 접수되었습니다.\n담당자가 빠른 시일 내에 기재해주신 연락처로 연락드리겠습니다.');
                    // 폼 초기화
                    inquiryForm.reset();
                    if (emailDomainInput) emailDomainInput.readOnly = false;
                    
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origBtnHtml;
                    submitBtn.style.opacity = '1';
                }, 2000);
            }
        });
    }

    // 개인정보 수집 및 이용 동의 모달 제어
    const btnOpenPrivacy = document.getElementById('btnOpenPrivacy');
    const btnClosePrivacy = document.getElementById('btnClosePrivacy');
    const privacyModal = document.getElementById('privacyModal');
    const privacyModalOverlay = document.querySelector('.privacy-modal-overlay');

    if (btnOpenPrivacy && privacyModal) {
        // 모달 열기
        btnOpenPrivacy.addEventListener('click', () => {
            privacyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        // 모달 닫기 함수
        const closePrivacyModal = () => {
            privacyModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (btnClosePrivacy) btnClosePrivacy.addEventListener('click', closePrivacyModal);
        if (privacyModalOverlay) privacyModalOverlay.addEventListener('click', closePrivacyModal);
    }

    // 6. 맨 위로 스크롤 버튼 (Scroll to Top) 제어
    const btnScrollTop = document.getElementById('btnScrollTop');

    if (btnScrollTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btnScrollTop.classList.add('visible');
            } else {
                btnScrollTop.classList.remove('visible');
            }
        });

        // 탑 버튼 클릭 시 Lenis의 스무스 스크롤 효과를 통해 맨 위로 부드럽게 스크롤
        btnScrollTop.addEventListener('click', () => {
            if (typeof lenis !== 'undefined') {
                lenis.scrollTo(0);
            } else {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    }

    // 7. 메인 히어로 3대 강점 리스트 자동 호버 순환 롤링 (Auto Hover Loop)
    const featureItems = document.querySelectorAll('.feature-item');
    if (featureItems.length > 0) {
        let currentLoopIndex = 0;
        let featureLoopInterval = null;
        const autoIntervalTime = 3200; // 3.2초 주기

        // 특정 인덱스의 항목 활성화 함수
        const activateFeatureIndex = (index) => {
            featureItems.forEach((item, idx) => {
                if (idx === index) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        };

        // 다음 리스트 항목으로 순환
        const rollNextFeature = () => {
            currentLoopIndex = (currentLoopIndex + 1) % featureItems.length;
            activateFeatureIndex(currentLoopIndex);
        };

        // 자동 순환 타이머 시작
        const startFeatureLoop = () => {
            if (featureLoopInterval) clearInterval(featureLoopInterval);
            featureLoopInterval = setInterval(rollNextFeature, autoIntervalTime);
        };

        // 자동 순환 타이머 중단
        const stopFeatureLoop = () => {
            if (featureLoopInterval) {
                clearInterval(featureLoopInterval);
                featureLoopInterval = null;
            }
        };

        // 페이지 로드 시 첫 번째 리스트 자동 활성화 및 롤링 루프 기동
        activateFeatureIndex(0);
        startFeatureLoop();

        // 마우스 호버/리브 시 일시 정지 및 포커스 동기화 인터랙션 연동
        featureItems.forEach((item, index) => {
            // 마우스 호버 시 자동 롤링 정지 및 해당 아이템 활성화
            item.addEventListener('mouseenter', () => {
                stopFeatureLoop();
                currentLoopIndex = index;
                activateFeatureIndex(currentLoopIndex);
            });

            // 마우스가 리스트를 떠나면 호버했던 인덱스부터 자동 롤링 재시작
            item.addEventListener('mouseleave', () => {
                startFeatureLoop();
            });
        });
    }

});
