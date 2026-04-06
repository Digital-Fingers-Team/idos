// login.js
document.addEventListener("DOMContentLoaded", () => {
    // التحقق من وجود جلسة نشطة
    if (localStorage.getItem('userSession') || sessionStorage.getItem('userSession')) {
        window.location.href = 'home.html';
        return;
    }

    // العناصر
    const authTitle = document.getElementById("authTitle");
    const authSubtitle = document.getElementById("authSubtitle");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const loginMessage = document.getElementById("loginMessage");
    
    const showRegisterBtn = document.getElementById("showRegisterBtn");
    const showLoginBtn = document.getElementById("showLoginBtn");
    
    const demoLoginButtons = document.querySelectorAll('.demo-login-btn');

    // تبديل الواجهات
    showRegisterBtn?.addEventListener("click", () => {
        const lang = GlobalSettings.getSetting('language');
        const t = GlobalSettings.translations[lang];
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        authTitle.textContent = t['register_btn'];
        authSubtitle.textContent = t['auth_subtitle_register'];
        loginMessage.classList.add("hidden");
    });

    showLoginBtn?.addEventListener("click", () => {
        const lang = GlobalSettings.getSetting('language');
        const t = GlobalSettings.translations[lang];
        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        authTitle.textContent = t['auth_welcome'];
        authSubtitle.textContent = t['auth_subtitle_login'];
        loginMessage.classList.add("hidden");
    });

    // عرض الرسائل
    const showMsg = (message, type = 'error') => {
        if (!loginMessage) return;
        const lang = GlobalSettings.getSetting('language');
        
        // ترجمة الرسائل الشائعة إذا لزم الأمر
        let translatedMsg = message;
        if (lang === 'en') {
            if (message === 'البريد الإلكتروني أو كلمة المرور غير صحيحة') translatedMsg = 'Invalid email or password';
            if (message === 'هذا البريد الإلكتروني مسجل بالفعل') translatedMsg = 'This email is already registered';
            if (message === 'كلمة المرور يجب أن تكون 6 أحرف على الأقل') translatedMsg = 'Password must be at least 6 characters';
            if (message === 'تم إنشاء الحساب بنجاح! جاري تسجيل دخولك...') translatedMsg = 'Account created successfully! Logging you in...';
        }

        loginMessage.textContent = translatedMsg;
        loginMessage.className = `message--${type}`;
        loginMessage.classList.remove("hidden");
        
        if (type === 'success') {
            setTimeout(() => loginMessage.classList.add("hidden"), 3000);
        }
    };

    // حفظ بيانات الجلسة والتوجيه
    const saveSessionAndRedirect = (user, rememberMe) => {
        const sessionData = {
            email: user.email,
            name: user.name,
            role: user.role || 'patient',
            loggedIn: true,
            timestamp: new Date().toISOString()
        };
        
        if (rememberMe) {
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('userSession', JSON.stringify(sessionData));
        }
        
        window.location.href = 'home.html';
    };

    // الحصول على المستخدمين من localStorage
    const getUsers = () => {
        const users = localStorage.getItem('idos_users');
        return users ? JSON.parse(users) : [
            { email: 'user@example.com', password: '123456', name: 'أحمد محمد', role: 'patient' },
            { email: 'doctor@idos.demo', password: 'doctor123', name: 'طبيب طوارئ', role: 'doctor' }
        ];
    };

    // حفظ مستخدم جديد
    const saveUser = (user) => {
        const users = getUsers();
        users.push(user);
        localStorage.setItem('idos_users', JSON.stringify(users));
    };

    // معالجة تسجيل الدخول
    loginForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const rememberMe = document.getElementById("rememberMe").checked;

        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            saveSessionAndRedirect(user, rememberMe);
        } else {
            showMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }
    });

    // معالجة إنشاء الحساب
    registerForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value;

        const users = getUsers();
        if (users.find(u => u.email === email)) {
            showMsg('هذا البريد الإلكتروني مسجل بالفعل');
            return;
        }

        if (password.length < 6) {
            showMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        const newUser = { name, email, password, role: 'patient' };
        saveUser(newUser);
        showMsg('تم إنشاء الحساب بنجاح! جاري تسجيل دخولك...', 'success');
        
        setTimeout(() => saveSessionAndRedirect(newUser, true), 1500);
    });

    // معالجة الدخول التجريبي
    demoLoginButtons.forEach(button => {
        button.addEventListener('click', () => {
            const role = button.dataset.role;
            const user = {
                email: role === 'doctor' ? 'doctor@idos.demo' : 'patient@idos.demo',
                name: role === 'doctor' ? 'طبيب طوارئ' : 'مريض طوارئ',
                role: role
            };
            saveSessionAndRedirect(user, true);
        });
    });
});
