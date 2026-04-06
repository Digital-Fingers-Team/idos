document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const preloader = document.getElementById("preloader");
    const navToggle = document.querySelector(".nav-toggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const timeline = document.getElementById("insightsTimeline");

    const bpValue = document.getElementById("bpValue");
    const bpStatus = document.getElementById("bpStatus");
    const glucoseValue = document.getElementById("glucoseValue");
    const glucoseStatus = document.getElementById("glucoseStatus");
    const pulseValue = document.getElementById("pulseValue");
    const pulseStatus = document.getElementById("pulseStatus");

    const pages = document.querySelectorAll(".page");

    // عناصر تسجيل الدخول والواجهات
    const loginBtn = document.getElementById("loginBtn");
    const mobileLoginBtn = document.getElementById("mobileLoginBtn");
    const loginModal = document.getElementById("loginModal");
    const successModal = document.getElementById("successModal");
    const closeLoginModal = document.getElementById("closeLoginModal");
    const closeSuccessModal = document.getElementById("closeSuccessModal");
    const continueBtn = document.getElementById("continueBtn");
    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");
    const loginSection = document.getElementById("loginSection");
    const userSection = document.getElementById("userSection");
    const authSection = document.getElementById("authSection");
    const mobileAuthSection = document.getElementById("mobileAuthSection");
    const logoutBtn = document.getElementById("logoutBtn");
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");

    // ============================================
    // تهيئة الإعدادات العالمية
    // ============================================
    
    function initializeGlobalSettings() {
        if (typeof GlobalSettings !== 'undefined') {
            if (!GlobalSettings.initialized) {
                GlobalSettings.init();
                GlobalSettings.applyAllSettings();
            }
        } else {
            const checkInterval = setInterval(() => {
                if (typeof GlobalSettings !== 'undefined') {
                    clearInterval(checkInterval);
                    GlobalSettings.init();
                    GlobalSettings.applyAllSettings();
                }
            }, 100);
            setTimeout(() => clearInterval(checkInterval), 5000);
        }
    }
    
    initializeGlobalSettings();

    // إضافة مستمع لتغييرات اللغة
    window.addEventListener('languageChanged', (e) => {
        console.log('تم تغيير اللغة إلى:', e.detail.language);
        updateVitalSignsStatus();
    });

    // إضافة مستمع لتغييرات الوضع الداكن
    const themeObserver = new MutationObserver(() => {
        const theme = document.documentElement.getAttribute('data-theme');
        const themeToggle = document.getElementById('darkModeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    });
    
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });

    const hideLoader = () => {
        if (!body.classList.contains("loading")) return;
        body.classList.remove("loading");
        preloader?.classList.add("preloader--hidden");
        pages.forEach((page) => page.classList.add("is-visible"));
    };

    window.addEventListener("load", () => {
        setTimeout(hideLoader, 450);
    });

    setTimeout(hideLoader, 2500);

    // تطبيق تأثيرات الحركة على جميع الأزرار
    const applyButtonAnimations = () => {
        const buttons = document.querySelectorAll(`
            button:not(.nav-toggle):not(.accordion-toggle):not(.theme-toggle):not(.lang-toggle),
            .btn,
            [class*="btn-"],
            .emergency-btn,
            .btn-login,
            .btn-logout,
            dialog button,
            input[type="submit"],
            input[type="button"]
        `);
        
        buttons.forEach(button => {
            if (!button.classList.contains('btn-animate')) {
                button.classList.add('btn-animate');
            }
        });
        
        if (navToggle) {
            navToggle.classList.add('btn-animate');
        }
        
        document.querySelectorAll('.accordion-toggle').forEach(toggle => {
            toggle.classList.add('btn-animate');
        });
        
        console.log(`تم تطبيق تأثيرات الحركة على ${buttons.length} زر`);
    };

    if (navToggle) {
        navToggle.addEventListener("click", () => {
            const expanded = navToggle.getAttribute("aria-expanded") === "true";
            navToggle.setAttribute("aria-expanded", String(!expanded));
            mobileMenu.hidden = expanded;
        });
    }

    mobileMenu?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navToggle?.setAttribute("aria-expanded", "false");
            mobileMenu.hidden = true;
        });
    });

    // وظائف تسجيل الدخول والنوافذ المنبثقة
    const openLoginModal = () => {
        loginModal?.showModal();
    };

    const closeLoginModalFunc = () => {
        loginModal?.close();
    };

    const openSuccessModal = () => {
        successModal?.showModal();
    };

    const closeSuccessModalFunc = () => {
        successModal?.close();
    };

    loginBtn?.addEventListener("click", openLoginModal);
    mobileLoginBtn?.addEventListener("click", openLoginModal);
    closeLoginModal?.addEventListener("click", closeLoginModalFunc);
    closeSuccessModal?.addEventListener("click", closeSuccessModalFunc);
    continueBtn?.addEventListener("click", closeSuccessModalFunc);

    loginModal?.addEventListener("click", (e) => {
        const dialogDimensions = loginModal.getBoundingClientRect();
        if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
        ) {
            closeLoginModalFunc();
        }
    });

    successModal?.addEventListener("click", (e) => {
        const dialogDimensions = successModal.getBoundingClientRect();
        if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
        ) {
            closeSuccessModalFunc();
        }
    });

    // Vital signs logic
    const getCurrentLanguage = () => {
        if (typeof GlobalSettings !== 'undefined') {
            return GlobalSettings.getSetting('language');
        }
        return localStorage.getItem('idos_current_language') || 'ar';
    };
    
    const evaluateStatus = (value, type) => {
        const lang = getCurrentLanguage();
        switch (type) {
            case "bp": {
                const [systolic, diastolic] = value;
                if (systolic > 140 || diastolic > 90) return { text: lang === 'ar' ? "مرتفع" : "High", color: "#b91c1c", bg: "rgba(239, 68, 68, 0.18)" };
                if (systolic < 90 || diastolic < 60) return { text: lang === 'ar' ? "منخفض" : "Low", color: "#0369a1", bg: "rgba(14, 165, 233, 0.18)" };
                return { text: lang === 'ar' ? "طبيعي" : "Normal", color: "#047857", bg: "rgba(34, 197, 94, 0.16)" };
            }
            case "glucose":
                if (value > 140) return { text: lang === 'ar' ? "مرتفع" : "High", color: "#b91c1c", bg: "rgba(239, 68, 68, 0.18)" };
                if (value < 70) return { text: lang === 'ar' ? "منخفض" : "Low", color: "#0369a1", bg: "rgba(14, 165, 233, 0.18)" };
                return { text: lang === 'ar' ? "طبيعي" : "Normal", color: "#047857", bg: "rgba(34, 197, 94, 0.16)" };
            case "pulse":
                if (value > 100) return { text: lang === 'ar' ? "مرتفع" : "High", color: "#b91c1c", bg: "rgba(239, 68, 68, 0.18)" };
                if (value < 60) return { text: lang === 'ar' ? "منخفض" : "Low", color: "#0369a1", bg: "rgba(14, 165, 233, 0.18)" };
                return { text: lang === 'ar' ? "طبيعي" : "Normal", color: "#047857", bg: "rgba(34, 197, 94, 0.16)" };
            default:
                return { text: lang === 'ar' ? "غير معروف" : "Unknown", color: "#0f172a", bg: "rgba(148, 163, 184, 0.2)" };
        }
    };

    const setChipStatus = (chip, status) => {
        chip.textContent = status.text;
        chip.style.color = status.color;
        chip.style.backgroundColor = status.bg;
    };
    
    const updateVitalSignsStatus = () => {
        if (bpValue && bpStatus) {
            const bp = bpValue.textContent.split('/').map(Number);
            if (bp.length === 2 && !isNaN(bp[0]) && !isNaN(bp[1])) {
                const status = evaluateStatus(bp, "bp");
                setChipStatus(bpStatus, status);
            }
        }
        if (glucoseValue && glucoseStatus) {
            const glucose = parseFloat(glucoseValue.textContent);
            if (!isNaN(glucose)) {
                const status = evaluateStatus(glucose, "glucose");
                setChipStatus(glucoseStatus, status);
            }
        }
        if (pulseValue && pulseStatus) {
            const pulse = parseFloat(pulseValue.textContent);
            if (!isNaN(pulse)) {
                const status = evaluateStatus(pulse, "pulse");
                setChipStatus(pulseStatus, status);
            }
        }
    };

    // Accordion
    document.querySelectorAll(".accordion-toggle").forEach((toggle) => {
        toggle.addEventListener("click", () => {
            const expanded = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!expanded));
            const panel = document.getElementById(toggle.getAttribute("aria-controls"));
            if (panel) {
                panel.hidden = expanded;
            }
        });
    });

    // Restore timeline from storage if available
    const storedTimeline = JSON.parse(localStorage.getItem("timelineEntries") || "[]");
    if (storedTimeline.length && timeline) {
        timeline.innerHTML = "";
        storedTimeline.forEach((entry) => {
            const li = document.createElement("li");
            li.className = "timeline__item";
            li.textContent = entry;
            timeline.appendChild(li);
        });
    }

    const saveTimeline = () => {
        if (!timeline) return;
        const items = Array.from(timeline.querySelectorAll(".timeline__item")).map((item) => item.textContent);
        localStorage.setItem("timelineEntries", JSON.stringify(items.slice(0, 6)));
    };

    const observer = new MutationObserver(saveTimeline);
    if (timeline) {
        observer.observe(timeline, { childList: true });
    }

    // تم نقل نظام تسجيل الدخول إلى auth-check.js و login.js لتوحيد العمل عبر المنصة
    
    const updateAuthUI = (user = null) => {
        const lang = getCurrentLanguage();
        const userNameElem = document.getElementById('userName');
        const userAvatarElem = document.querySelector('.user-avatar');
        
        if (user) {
            if (userNameElem) userNameElem.textContent = user.name;
            if (userAvatarElem) userAvatarElem.textContent = user.name.charAt(0).toUpperCase();
        }
    };

    const checkExistingSession = () => {
        const sessionData = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
        if (sessionData) {
            try {
                const user = JSON.parse(sessionData);
                updateAuthUI(user);
            } catch(e) { console.error(e); }
        }
    };

    const addInputEffects = () => {
        const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
        
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                if (!this.value) {
                    this.parentElement.classList.remove('focused');
                }
            });
            
            input.addEventListener('input', function() {
                if (this.type === 'email' && this.value) {
                    if (validateEmail(this.value)) {
                        this.style.borderColor = '#22c55e';
                    } else {
                        this.style.borderColor = '#ef4444';
                    }
                }
            });
        });
    };

    const createDashboardSidebar = () => {
        if (document.getElementById('dashboardSidebar')) return;
        
        const sidebar = document.createElement('div');
        sidebar.id = 'dashboardSidebar';
        sidebar.className = 'dashboard-sidebar';
        sidebar.innerHTML = `
            <div class="dashboard-sidebar__overlay" id="dashboardSidebarOverlay"></div>
            <div class="dashboard-sidebar__content">
                <div class="dashboard-sidebar__header">
                    <div class="dashboard-sidebar__logo">
                        <i class="fas fa-stethoscope"></i>
                        <span>IDOS</span>
                    </div>
                    <button class="dashboard-sidebar__close" id="dashboardSidebarClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <nav class="dashboard-sidebar__nav">
                    <a href="home.html" class="dashboard-sidebar__link" data-i18n="home">
                        <span class="dashboard-sidebar__icon"><i class="fas fa-home"></i></span>
                        <span class="dashboard-sidebar__text">الرئيسية</span>
                    </a>
                    <a href="diagnosis.html" class="dashboard-sidebar__link" data-i18n="diagnosis">
                        <i class="fas fa-diagnoses"></i>
                        <span>التشخيص</span>
                    </a>
                    <a href="chat.html" class="dashboard-sidebar__link" data-i18n="chat">
                        <i class="fas fa-comments"></i>
                        <span>محادثة</span>
                    </a>
                    <a href="hospitals.html" class="dashboard-sidebar__link" data-i18n="hospitals">
                        <i class="fas fa-hospital"></i>
                        <span>المستشفيات</span>
                    </a>
                    <a href="settings.html" class="dashboard-sidebar__link" data-i18n="settings">
                        <i class="fas fa-cog"></i>
                        <span>الإعدادات</span>
                    </a>
                    <div class="dashboard-sidebar__user" id="dashboardSidebarUser">
                    </div>
                </nav>
            </div>
        `;
        
        document.body.appendChild(sidebar);
        addDashboardSidebarStyles();
        setupDashboardSidebarEvents();
    };
    
    const addDashboardSidebarStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .dashboard-sidebar {
                position: fixed;
                top: 0;
                right: -100%;
                width: 85%;
                max-width: 320px;
                height: 100%;
                background: var(--color-surface);
                z-index: 10000;
                transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
            }
            
            .dashboard-sidebar.active {
                right: 0;
            }
            
            .dashboard-sidebar__overlay {
                position: fixed;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .dashboard-sidebar__overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .dashboard-sidebar__content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
            }
            
            .dashboard-sidebar__header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem 1rem;
                background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
                color: white;
            }
            
            .dashboard-sidebar__logo {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 700;
                font-size: 1.2rem;
            }
            
            .dashboard-sidebar__close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                transition: background 0.3s;
            }
            
            .dashboard-sidebar__close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .dashboard-sidebar__nav {
                flex: 1;
                padding: 1rem 0;
            }
            
            .dashboard-sidebar__link {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem 1.5rem;
                text-decoration: none;
                color: var(--color-secondary);
                transition: all 0.3s;
                border-right: 3px solid transparent;
            }
            
            .dashboard-sidebar__link:hover,
            .dashboard-sidebar__link.active {
                background: rgba(139, 92, 246, 0.1);
                color: var(--color-primary);
                border-right-color: var(--color-primary);
            }
            
            .dashboard-sidebar__link i {
                width: 20px;
                text-align: center;
            }
            
            .dashboard-sidebar__user {
                padding: 1.5rem;
                border-top: 1px solid var(--color-border);
                margin-top: auto;
            }
            
            .dashboard-sidebar__user-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1rem;
            }
            
            .dashboard-sidebar__user-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 1.2rem;
            }
            
            .dashboard-sidebar__user-details {
                flex: 1;
            }
            
            .dashboard-sidebar__user-name {
                font-weight: 700;
                margin-bottom: 0.25rem;
            }
            
            .dashboard-sidebar__user-email {
                font-size: 0.85rem;
                color: var(--color-muted);
            }
            
            .dashboard-sidebar__actions {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .dashboard-sidebar__action-btn {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                background: none;
                border: 1px solid var(--color-border);
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: all 0.3s;
                font-family: inherit;
                font-size: 0.9rem;
                color: var(--color-secondary);
            }
            
            .dashboard-sidebar__action-btn:hover {
                background: rgba(139, 92, 246, 0.1);
                border-color: var(--color-primary);
                color: var(--color-primary);
            }
            
            .dashboard-sidebar__action-btn.logout {
                color: var(--color-danger);
                border-color: rgba(239, 68, 68, 0.3);
            }
            
            .dashboard-sidebar__action-btn.logout:hover {
                background: rgba(239, 68, 68, 0.1);
            }
            
            @media (max-width: 480px) {
                .dashboard-sidebar {
                    width: 90%;
                }
            }
            
            @media (min-width: 769px) {
                .dashboard-sidebar,
                .dashboard-sidebar__overlay {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    };
    
    const setupDashboardSidebarEvents = () => {
        const sidebar = document.getElementById('dashboardSidebar');
        const overlay = document.getElementById('dashboardSidebarOverlay');
        const closeBtn = document.getElementById('dashboardSidebarClose');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', openDashboardSidebar);
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeDashboardSidebar);
        }
        
        if (overlay) {
            overlay.addEventListener('click', closeDashboardSidebar);
        }
        
        document.querySelectorAll('.dashboard-sidebar__link').forEach(link => {
            link.addEventListener('click', closeDashboardSidebar);
        });
        
        updateDashboardSidebarUser();
    };
    
    const openDashboardSidebar = () => {
        const sidebar = document.getElementById('dashboardSidebar');
        const overlay = document.getElementById('dashboardSidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };
    
    const closeDashboardSidebar = () => {
        const sidebar = document.getElementById('dashboardSidebar');
        const overlay = document.getElementById('dashboardSidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    };
    
    const updateDashboardSidebarUser = () => {
        const userSection = document.getElementById('dashboardSidebarUser');
        if (!userSection) return;
        
        const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
        const lang = getCurrentLanguage();
        
        if (userSession) {
            try {
                const userData = JSON.parse(userSession);
                userSection.innerHTML = `
                    <div class="dashboard-sidebar__user-info">
                        <div class="dashboard-sidebar__user-avatar">${userData.name ? userData.name.charAt(0) : (lang === 'ar' ? 'م' : 'U')}</div>
                        <div class="dashboard-sidebar__user-details">
                            <div class="dashboard-sidebar__user-name">${userData.name || (lang === 'ar' ? 'مستخدم' : 'User')}</div>
                            <div class="dashboard-sidebar__user-email">${userData.email || ''}</div>
                        </div>
                    </div>
                    <div class="dashboard-sidebar__actions">
                        <button class="dashboard-sidebar__action-btn" onclick="window.location.href='settings.html'">
                            <i class="fas fa-user-cog"></i>
                            <span>${lang === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}</span>
                        </button>
                        <button class="dashboard-sidebar__action-btn logout" id="dashboardSidebarLogout">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>${lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                        </button>
                    </div>
                `;
                
                document.getElementById('dashboardSidebarLogout')?.addEventListener('click', () => {
                    localStorage.removeItem('userSession');
                    sessionStorage.removeItem('userSession');
                    window.location.reload();
                });
                
            } catch (e) {
                console.error('خطأ في تحليل بيانات المستخدم:', e);
                userSection.innerHTML = `
                    <div class="dashboard-sidebar__actions">
                        <button class="dashboard-sidebar__action-btn" onclick="window.location.href='index.html'">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>${lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
                        </button>
                    </div>
                `;
            }
        } else {
            userSection.innerHTML = `
                <div class="dashboard-sidebar__actions">
                    <button class="dashboard-sidebar__action-btn" onclick="window.location.href='index.html'">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>${lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
                    </button>
                </div>
            `;
        }
        
        const links = document.querySelectorAll('.dashboard-sidebar__link');
        links.forEach(link => {
            const span = link.querySelector('span');
            if (span && link.getAttribute('data-i18n')) {
                const key = link.getAttribute('data-i18n');
                const translationsMap = {
                    ar: { home: 'الرئيسية', diagnosis: 'التشخيص', chat: 'محادثة', hospitals: 'المستشفيات', settings: 'الإعدادات' },
                    en: { home: 'Home', diagnosis: 'Diagnosis', chat: 'Chat', hospitals: 'Hospitals', settings: 'Settings' }
                };
                if (translationsMap[lang] && translationsMap[lang][key]) {
                    span.textContent = translationsMap[lang][key];
                }
            }
        });
    };

    const updateMobileSidebarUser = () => {
        updateDashboardSidebarUser();
    };

    // تهيئة الصفحة
    const init = () => {
        applyButtonAnimations();
        
        checkExistingSession();
        addInputEffects();
        applyButtonAnimations();
        createDashboardSidebar();
        
        updateVitalSignsStatus();
        
        document.querySelectorAll('.emergency-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
                
                console.log('تم النقر على زر الطوارئ:', this.querySelector('strong')?.textContent);
            });
        });

        window.addEventListener('resize', () => {
            setTimeout(applyButtonAnimations, 300);
        });
        
        console.log('✅ تم تهيئة الصفحة بنجاح مع نظام الإعدادات العام');
    };

    init();
});

// Google Maps callback
let map;
let userMarker;
let infoWindow;

window.initMap = function () {
    const mapContainer = document.getElementById("mapCanvas");
    const statusEl = document.getElementById("mapStatus");
    if (!mapContainer) return;

    const benha = { lat: 30.466141, lng: 31.184769 };
    map = new google.maps.Map(mapContainer, {
        center: benha,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });

    infoWindow = new google.maps.InfoWindow();

    const hospitals = [
        {
            name: "مستشفى بنها الجامعي",
            position: { lat: 30.466611, lng: 31.177723 },
            address: "شارع كورنيش النيل، بنها"
        },
        {
            name: "مستشفى بنها التعليمي",
            position: { lat: 30.470851, lng: 31.188932 },
            address: "شارع الجيش، بنها"
        },
        {
            name: "مستشفى الراعي الصالح",
            position: { lat: 30.460148, lng: 31.191663 },
            address: "شارع فريد ندي، بنها"
        },
        {
            name: "مركز بنها الطبي المتخصص",
            position: { lat: 30.472942, lng: 31.182431 },
            address: "ميدان الإشارة، بنها"
        }
    ];

    hospitals.forEach((hospital) => {
        const marker = new google.maps.Marker({
            position: hospital.position,
            map,
            title: hospital.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#2563eb",
                fillOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: "#1d4ed8"
            }
        });

        marker.addListener("click", () => {
            infoWindow.setContent(`
                <div style="text-align:right; min-width:200px;">
                    <strong>${hospital.name}</strong>
                    <p style="margin:6px 0;">${hospital.address}</p>
                    <p style="margin:6px 0; color: #ef4444; font-weight: bold;">☎️ 123</p>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${hospital.position.lat},${hospital.position.lng}" target="_blank" rel="noopener">عرض الاتجاهات</a>
                </div>
            `);
            infoWindow.open(map, marker);
        });
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                if (!userMarker) {
                    userMarker = new google.maps.Marker({
                        position: userLocation,
                        map,
                        title: "موقعك الحالي",
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#22c55e",
                            fillOpacity: 0.9,
                            strokeWeight: 3,
                            strokeColor: "#15803d"
                        }
                    });
                } else {
                    userMarker.setPosition(userLocation);
                }
                map.panTo(userLocation);
                if (statusEl) {
                    statusEl.textContent = "تم تحديد موقعك الحالي. يمكنك استكشاف المستشفيات حولك.";
                }
            },
            (error) => {
                console.warn("خطأ في تحديد الموقع:", error);
                if (statusEl) {
                    statusEl.textContent = "تعذر تحديد موقعك. يمكنك السماح بالوصول إلى الموقع أو البحث يدويًا.";
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        if (statusEl) {
            statusEl.textContent = "المتصفح لا يدعم التتبع الجغرافي.";
        }
    }
};