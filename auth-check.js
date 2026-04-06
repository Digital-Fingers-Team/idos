// auth-check.js
(function() {
    const session = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    
    // قائمة الصفحات العامة التي لا تتطلب تسجيل دخول
    const publicPages = ['index.html'];
    const isPublicPage = publicPages.some(page => window.location.pathname.includes(page)) || window.location.pathname === '/' || window.location.pathname.endsWith('/');

    // إذا لم يكن هناك جلسة، توجه لصفحة تسجيل الدخول (إلا إذا كنت فيها بالفعل)
    if (!session && !isPublicPage) {
        window.location.href = 'index.html';
        return;
    }

    // إذا كان هناك جلسة وأنت في صفحة تسجيل الدخول، توجه للرئيسية
    if (session && isPublicPage) {
        window.location.href = 'home.html';
        return;
    }

    if (session) {
        const userData = JSON.parse(session);
        
        // تحديث واجهة المستخدم عند تحميل الصفحة
        document.addEventListener("DOMContentLoaded", () => {
            // تفعيل أزرار تسجيل الخروج في أي مكان
            const logoutBtns = document.querySelectorAll('#logoutBtn, .logout-btn, [data-action="logout"], #sidebarLogout');
            logoutBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
            });
        });
    }
})();

function logout() {
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    window.location.href = 'index.html';
}
