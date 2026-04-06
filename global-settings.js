// global-settings.js
// نظام الإعدادات العالمي للموقع بالكامل

window.GlobalSettings = (function() {
    'use strict';
    
    // ============================================
    // الإعدادات الافتراضية
    // ============================================
    const DEFAULT_SETTINGS = {
        theme: 'light',           // light, dark, system
        language: 'ar',           // ar, en
        fontSize: 'normal',       // normal, large, xlarge
        highContrast: false,      // true, false
        reduceAnimations: false,  // true, false
        emailNotifications: true,
        appNotifications: true,
        dataCollection: true,
        userActivity: false,
        publicProfile: false,
        performanceMode: false,
        autoBackup: false,
        autoUpdate: true
    };
    
    // الحالة الحالية
    let currentSettings = { ...DEFAULT_SETTINGS };
    let initialized = false;
    let themeObserver = null;
    
    // ============================================
    // قائمة الترجمات (i18n)
    // ============================================
    const translations = {
        ar: {
            // عام
            'logo': 'تشخيص فوري',
            'home': 'الرئيسية',
            'diagnosis': 'التشخيص',
            'chat': 'محادثة AI',
            'hospitals': 'المستشفيات',
            'settings': 'الإعدادات',
            'logout': 'تسجيل الخروج',
            'login': 'تسجيل الدخول',
            'register': 'إنشاء حساب',
            'search': 'بحث',
            'cancel': 'إلغاء',
            'save': 'حفظ',
            'delete': 'حذف',
            'edit': 'تعديل',
            'close': 'إغلاق',
            'back': 'رجوع',
            'continue': 'متابعة',
            'welcome': 'مرحباً بك',
            'home_title': 'تشخيص فوري للأعراض | الصفحة الرئيسية',
            'login_title': 'تسجيل الدخول | IDOS',
            'diagnosis_title_page': 'تشخيص فوري للأعراض | التحليل الذكي',
            'chat_title_page': 'تشخيص فوري للأعراض | محادثة AI',
            'hospitals_title_page': 'تشخيص فوري للأعراض | المستشفيات القريبة',
            'settings_title_page': 'تشخيص فوري للأعراض | الإعدادات',
            'facebook': 'فيسبوك',
            'twitter': 'تويتر',
            'instagram': 'إنستغرام',
            'email': 'البريد الإلكتروني',
            'phone': 'الهاتف',
            
            // صفحة الدخول
            'auth_welcome': 'مرحباً بك',
            'auth_subtitle_login': 'سجل الدخول للمتابعة في منصة IDOS',
            'auth_subtitle_register': 'انضم إلينا للحصول على رعاية صحية أفضل',
            'email_label': 'البريد الإلكتروني',
            'password_label': 'كلمة المرور',
            'name_label': 'الاسم الكامل',
            'name_desc': 'الاسم الذي يظهر للآخرين',
            'remember_me': 'تذكرني',
            'forgot_password': 'نسيت كلمة المرور؟',
            'login_btn': 'تسجيل الدخول',
            'register_btn': 'إنشاء حساب جديد',
            'create_account_btn': 'إنشاء الحساب',
            'have_account': 'لديك حساب بالفعل؟',
            'or_by': 'أو بواسطة',
            'auth_footer_desc': 'تقدر تدخل مباشرة أو تنشئ حساب جديد، وكلهم هيوصلوك للصفحة الرئيسية.',
            'demo_title': 'نظام تجريبي للطوارئ',
            'demo_desc': 'للدخول السريع وقت الحاجة، اختر نوع الحساب المناسب.',
            'login_as_patient': 'سجل كمريض',
            'login_as_doctor': 'سجل كطبيب',
            
            // الصفحة الرئيسية
            'hero_badge': 'منصة صحة رقمية متكاملة',
            'hero_title': 'تشخيص ذكي للأعراض مع متابعة فورية لحالتك الصحية',
            'hero_desc': 'ابدأ رحلتك مع منصة تشخيص فوري للأعراض لتحصل على توصيات دقيقة، خريطة للمستشفيات القريبة، ومحادثة مع مساعد طبي ذكي.',
            'start_diagnosis': 'ابدأ التشخيص الآن',
            'talk_ai': 'تحدث مع المساعد الذكي',
            'stat_sessions': 'جلسة تشخيص ناجحة',
            'stat_satisfaction': 'رضا المستخدمين',
            'stat_support': 'دعم واستشارات',
            'instant_diagnosis_title': 'التشخيص الفوري',
            'instant_diagnosis_desc': 'تحليل دقيق للأعراض باستخدام أحدث تقنيات الذكاء الاصطناعي',
            'try_now': 'جربه الآن',
            'services_title': 'خدمات المنصة',
            'services_desc': 'مجموعة أدوات متكاملة لمتابعة صحتك من مكان واحد',
            'feature_symptoms_title': 'تشخيص الأعراض',
            'feature_symptoms_desc': 'تحليل دقيق للأعراض باستخدام قاعدة بيانات واسعة يتم تحديثها باستمرار',
            'go_to_diagnosis': 'انتقل لصفحة التشخيص',
            'feature_chat_title': 'محادثة طبية فورية',
            'feature_chat_desc': 'تواصل مع مساعد طبي افتراضي للحصول على نصائح مبدئية حول حالتك',
            'start_chat': 'ابدأ المحادثة',
            'feature_map_title': 'تحديد أقرب المستشفيات',
            'feature_map_desc': 'خريطة تفاعلية تعتمد على موقعك الجغرافي لعرض أهم المراكز والمستشفيات القريبة',
            'view_map': 'عرض الخريطة',
            'extra_services': 'خدمات إضافية',
            'extra_desc': 'خدمات متكاملة لرعاية صحتك بشكل أفضل',
            'service_vitals': 'مراقبة المؤشرات',
            'service_vitals_desc': 'تتبع ومراقبة المؤشرات الحيوية الأساسية لحالتك الصحية',
            'service_appointments': 'مواعيد الطبيب',
            'service_appointments_desc': 'حجز مواعيد مع الأطباء المتخصصين بسهولة وسرعة',
            'service_meds': 'إدارة الأدوية',
            'service_meds_desc': 'تنظيم وجدولة الأدوية والجرعات والمتابعة اليومية',
            'service_records': 'السجل الصحي',
            'service_records_desc': 'تخزين وتنظيم السجلات والتقارير الطبية بشكل آمن',
            
            // صفحة التشخيص
            'diagnosis_title': 'التحليل الذكي للأعراض',
            'diagnosis_subtitle': 'أدخل الأعراض التي تشعر بها للحصول على تشخيص دقيق ومبني على بيانات طبية',
            'symptoms_question': 'ما هي الأعراض التي تشعر بها؟',
            'symptoms_desc': 'اكتب العرض ثم اضغط "إضافة" أو اختر من الاقتراحات',
            'symptom_placeholder': 'مثلاً: بطني بتوجعني، صداع، سخونية...',
            'add_btn': 'إضافة',
            'no_symptoms': 'لم يتم إضافة أعراض بعد',
            'clear_all': 'مسح الكل',
            'suggestions_title': 'اقتراحات شائعة:',
            'next_step': 'المتابعة للخطوة التالية',
            'extra_info_title': 'معلومات إضافية',
            'age_label': 'العمر',
            'age_placeholder': 'أدخل عمرك',
            'gender_label': 'الجنس',
            'male': 'ذكر',
            'female': 'أنثى',
            'back_btn': 'رجوع',
            'final_analysis': 'بدء التحليل النهائي',
            'analyzing': 'جاري تحليل الأعراض ومطابقتها مع قاعدة البيانات الطبية...',
            'symptom_stomach': 'بطني بتوجعني',
            'symptom_fever': 'سخونية',
            'symptom_cough': 'كحة',
            'symptom_vision': 'زغللة في عيني',
            'symptom_breath': 'نهجان',
            'symptom_tired': 'تعبان وهمدان',
            'symptom_back': 'ضهري بيوجعني',
            
            // الطوارئ
            'emergency_title': 'رقم الطوارئ الموحد',
            'emergency_desc': 'اتصل فوراً في الحالات الطارئة. هذا الرقم يعمل على مدار 24 ساعة.',
            'call_now': 'اتصل الآن',
            
            // إعدادات الصفحة
            'settings_title': 'إعدادات الحساب والنظام',
            'settings_subtitle': 'إدارة تفضيلات حسابك وإعدادات الخصوصية والنظام',
            'account_settings': 'إعدادات الحساب',
            'privacy': 'الخصوصية والأمان',
            'system_settings': 'إعدادات النظام',
            'import_export': 'استيراد/تصدير الإعدادات',
            'advanced_actions': 'إجراءات متقدمة',
            'language': 'اللغة',
            'language_desc': 'اختر اللغة المفضلة للواجهة',
            'theme': 'المظهر',
            'theme_desc': 'اختر وضع الألوان المفضل',
            'light': 'فاتح',
            'dark': 'داكن',
            'dark_mode': 'الوضع المظلم',
            'system': 'تلقائي',
            'email_notifications': 'الإشعارات عبر البريد',
            'email_notifications_desc': 'تلقي إشعارات عبر البريد الإلكتروني',
            'app_notifications': 'الإشعارات التطبيقية',
            'app_notifications_desc': 'تلقي إشعارات داخل التطبيق',
            'data_collection': 'جمع البيانات',
            'data_collection_desc': 'السماح بجمع البيانات لتحسين التجربة',
            'user_activity': 'نشاط المستخدم',
            'user_activity_desc': 'مشاركة نشاطك مع الآخرين',
            'public_profile': 'الملف الشخصي العام',
            'public_profile_desc': 'السماح للآخرين بمشاهدة ملفك الشخصي',
            'performance_mode': 'وضع الأداء',
            'performance_mode_desc': 'تحسين الأداء على حساب بعض الميزات',
            'auto_backup': 'النسخ الاحتياطي',
            'auto_backup_desc': 'إنشاء نسخة احتياطية تلقائية للبيانات',
            'auto_update': 'التحديث التلقائي',
            'auto_update_desc': 'تثبيت التحديثات تلقائياً عند توفرها',
            'export_settings': 'تصدير الإعدادات',
            'export_settings_desc': 'حفظ نسخة احتياطية من جميع إعداداتك',
            'import_settings': 'استيراد الإعدادات',
            'import_settings_desc': 'استعادة الإعدادات من ملف نسخة احتياطية',
            'reset_settings': 'إعادة التعيين',
            'reset_settings_desc': 'إعادة جميع الإعدادات إلى القيم الافتراضية',
            'delete_all_data': 'حذف جميع البيانات',
            'delete_all_data_desc': 'حذف جميع البيانات المحفوظة بما في ذلك الإعدادات والسجل',
            'clear_cache': 'تفريغ الذاكرة المؤقتة',
            'clear_cache_desc': 'مسح جميع البيانات المؤقتة لتحسين الأداء',
            'save_changes': 'حفظ جميع التغييرات',
            'export': 'تصدير',
            'import': 'استيراد',
            'reset': 'إعادة التعيين',
            'delete_all': 'حذف الكل',
            'clear': 'تفريغ',
            'user_profile_title': 'الملف الشخصي والقائمة',
            
            // المستشفيات
            'hospitals_title': 'المستشفيات والمراكز الطبية القريبة',
            'search_placeholder': 'ابحث عن مستشفى، عيادة أو صيدلية...',
            'search_hospital_placeholder': 'ابحث عن مستشفى أو تخصص...',
            'all_specialties': 'جميع التخصصات',
            'cardiology': 'قلب',
            'orthopedics': 'عظام',
            'pediatrics': 'أطفال',
            'nearby_hospitals': 'المستشفيات القريبة',
            'results_found_8': 'تم العثور على 8 نتائج في بنها',
            'filter_all': 'الكل',
            'filter_hospitals': 'مستشفيات',
            'filter_clinics': 'عيادات',
            'filter_pharmacies': 'صيدليات',
            'use_location': 'استخدام موقعي الحالي',
            
            // المحادثة
            'chat_title': 'المساعد الطبي الذكي',
            'chat_welcome': 'مرحباً! أنا مساعدك الطبي الذكي. كيف يمكنني مساعدتك اليوم؟',
            'type_message': 'اكتب رسالتك هنا...',
            'send': 'إرسال',
            'new_chat': 'محادثة جديدة',
            'chat_history_1': 'استشارة حول آلام الظهر',
            'chat_history_2': 'أعراض الإنفلونزا',
            'time_2h': 'منذ ساعتين',
            'time_yesterday': 'أمس',
            'attach_file': 'إرفاق ملف',
            
            // الفوتر
            'quick_links': 'روابط سريعة',
            'our_services': 'خدماتنا',
            'contact_us': 'اتصل بنا',
            'about': 'عن المنصة',
            'how_to_use': 'كيفية الاستخدام',
            'faq': 'الأسئلة الشائعة',
            'help_center': 'مركز المساعدة',
            'terms': 'الشروط والأحكام',
            'privacy_policy': 'سياسة الخصوصية',
            'report': 'الإبلاغ عن مشكلة',
            'tech_support': 'الدعم الفني',
            'copyright': 'جميع الحقوق محفوظة © 2026 تشخيص فوري للأعراض. تصميم وتطوير ✨',
            'back_to_home': 'العودة للرئيسية',
            
            // رسائل
            'settings_saved': 'تم حفظ الإعدادات بنجاح!',
            'settings_reset': 'تم إعادة تعيين الإعدادات',
            'settings_exported': 'تم تصدير الإعدادات',
            'settings_imported': 'تم استيراد الإعدادات بنجاح',
            'data_deleted': 'تم حذف جميع البيانات',
            'cache_cleared': 'تم تفريغ الذاكرة المؤقتة',
            'changes_cancelled': 'تم إلغاء التغييرات',
            'error_import': 'خطأ في استيراد الملف',
            'confirm_reset': '⚠️ تحذير: هل أنت متأكد من إعادة تعيين جميع الإعدادات؟',
            'confirm_delete': '⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه! هل أنت متأكد؟',
            'default_user': 'مستخدم'
        },
        en: {
            // General
            'logo': 'IDOS',
            'home': 'Home',
            'diagnosis': 'Diagnosis',
            'chat': 'AI Chat',
            'hospitals': 'Hospitals',
            'settings': 'Settings',
            'logout': 'Logout',
            'login': 'Login',
            'register': 'Register',
            'search': 'Search',
            'cancel': 'Cancel',
            'save': 'Save',
            'delete': 'Delete',
            'edit': 'Edit',
            'close': 'Close',
            'back': 'Back',
            'continue': 'Continue',
            'welcome': 'Welcome back',
            'home_title': 'Instant Diagnosis | Home',
            'login_title': 'Login | IDOS',
            'diagnosis_title_page': 'Instant Diagnosis | Smart Analysis',
            'chat_title_page': 'Instant Diagnosis | AI Chat',
            'hospitals_title_page': 'Instant Diagnosis | Nearby Hospitals',
            'settings_title_page': 'Instant Diagnosis | Settings',
            'facebook': 'Facebook',
            'twitter': 'Twitter',
            'instagram': 'Instagram',
            'email': 'Email',
            'phone': 'Phone',
            
            // Auth Page
            'auth_welcome': 'Welcome',
            'auth_subtitle_login': 'Log in to continue to IDOS platform',
            'auth_subtitle_register': 'Join us for better healthcare',
            'email_label': 'Email Address',
            'password_label': 'Password',
            'name_label': 'Full Name',
            'name_desc': 'The name visible to others',
            'remember_me': 'Remember me',
            'forgot_password': 'Forgot password?',
            'login_btn': 'Log In',
            'register_btn': 'Create New Account',
            'create_account_btn': 'Create Account',
            'have_account': 'Already have an account?',
            'or_by': 'Or by',
            'auth_footer_desc': 'You can log in directly or create a new account, both will lead you to the home page.',
            'demo_title': 'Emergency Demo System',
            'demo_desc': 'For quick access when needed, choose the appropriate account type.',
            'login_as_patient': 'Login as Patient',
            'login_as_doctor': 'Login as Doctor',
            
            // Hero
            'hero_badge': 'Integrated Digital Health Platform',
            'hero_title': 'Smart Symptom Diagnosis with Instant Health Monitoring',
            'hero_desc': 'Start your journey with the Symptom Diagnosis platform to get accurate recommendations, a map of nearby hospitals, and a conversation with a smart medical assistant.',
            'start_diagnosis': 'Start Diagnosis',
            'talk_ai': 'Talk to AI Assistant',
            'stat_sessions': 'Successful Sessions',
            'stat_satisfaction': 'User Satisfaction',
            'stat_support': '24/7 Support',
            'instant_diagnosis_title': 'Instant Diagnosis',
            'instant_diagnosis_desc': 'Accurate symptom analysis using the latest AI technology',
            'try_now': 'Try Now',
            'services_title': 'Platform Services',
            'services_desc': 'Integrated tools to monitor your health from one place',
            'feature_symptoms_title': 'Symptom Diagnosis',
            'feature_symptoms_desc': 'Accurate symptom analysis using a continuously updated database',
            'go_to_diagnosis': 'Go to Diagnosis',
            'feature_chat_title': 'Instant Medical Chat',
            'feature_chat_desc': 'Chat with a virtual medical assistant for preliminary advice',
            'start_chat': 'Start Chat',
            'feature_map_title': 'Find Nearby Hospitals',
            'feature_map_desc': 'Interactive map based on your location showing nearby hospitals',
            'view_map': 'View Map',
            'extra_services': 'Additional Services',
            'extra_desc': 'Comprehensive services for better health care',
            'service_vitals': 'Vital Signs',
            'service_vitals_desc': 'Track and monitor your vital health indicators',
            'service_appointments': 'Doctor Appointments',
            'service_appointments_desc': 'Book appointments with specialists easily',
            'service_meds': 'Medication Management',
            'service_meds_desc': 'Organize medications, dosages, and daily tracking',
            'service_records': 'Health Records',
            'service_records_desc': 'Securely store and organize medical records',
            
            // Diagnosis Page
            'diagnosis_title': 'Smart Symptom Analysis',
            'diagnosis_subtitle': 'Enter your symptoms for accurate medical-based diagnosis',
            'symptoms_question': 'What symptoms are you feeling?',
            'symptoms_desc': 'Type a symptom then click "Add" or choose from suggestions',
            'symptom_placeholder': 'e.g., Stomach pain, headache, fever...',
            'add_btn': 'Add',
            'no_symptoms': 'No symptoms added yet',
            'clear_all': 'Clear All',
            'suggestions_title': 'Common Suggestions:',
            'next_step': 'Continue to Next Step',
            'extra_info_title': 'Additional Information',
            'age_label': 'Age',
            'age_placeholder': 'Enter your age',
            'gender_label': 'Gender',
            'male': 'Male',
            'female': 'Female',
            'back_btn': 'Back',
            'final_analysis': 'Start Final Analysis',
            'analyzing': 'Analyzing symptoms and matching with medical database...',
            'symptom_stomach': 'Stomach pain',
            'symptom_fever': 'Fever',
            'symptom_cough': 'Cough',
            'symptom_vision': 'Blurred vision',
            'symptom_breath': 'Shortness of breath',
            'symptom_tired': 'Tiredness & Fatigue',
            'symptom_back': 'Back pain',
            
            // Emergency
            'emergency_title': 'Emergency Hotline',
            'emergency_desc': 'Call immediately in emergencies. Available 24/7.',
            'call_now': 'Call Now',
            
            // Settings
            'settings_title': 'Account & System Settings',
            'settings_subtitle': 'Manage your account preferences and privacy settings',
            'account_settings': 'Account Settings',
            'privacy': 'Privacy & Security',
            'system_settings': 'System Settings',
            'import_export': 'Import/Export Settings',
            'advanced_actions': 'Advanced Actions',
            'language': 'Language',
            'language_desc': 'Choose your preferred interface language',
            'theme': 'Theme',
            'theme_desc': 'Choose your preferred color theme',
            'light': 'Light',
            'dark': 'Dark',
            'dark_mode': 'Dark Mode',
            'system': 'System',
            'email_notifications': 'Email Notifications',
            'email_notifications_desc': 'Receive notifications via email',
            'app_notifications': 'App Notifications',
            'app_notifications_desc': 'Receive in-app notifications',
            'data_collection': 'Data Collection',
            'data_collection_desc': 'Allow data collection to improve experience',
            'user_activity': 'User Activity',
            'user_activity_desc': 'Share your activity with others',
            'public_profile': 'Public Profile',
            'public_profile_desc': 'Allow others to view your profile',
            'performance_mode': 'Performance Mode',
            'performance_mode_desc': 'Optimize performance at the expense of some features',
            'auto_backup': 'Auto Backup',
            'auto_backup_desc': 'Create automatic data backups',
            'auto_update': 'Auto Update',
            'auto_update_desc': 'Install updates automatically when available',
            'export_settings': 'Export Settings',
            'export_settings_desc': 'Save a backup of all your settings',
            'import_settings': 'Import Settings',
            'import_settings_desc': 'Restore settings from a backup file',
            'reset_settings': 'Reset Settings',
            'reset_settings_desc': 'Reset all settings to default values',
            'delete_all_data': 'Delete All Data',
            'delete_all_data_desc': 'Delete all saved data including settings and history',
            'clear_cache': 'Clear Cache',
            'clear_cache_desc': 'Clear temporary data to improve performance',
            'save_changes': 'Save All Changes',
            'export': 'Export',
            'import': 'Import',
            'reset': 'Reset',
            'delete_all': 'Delete All',
            'clear': 'Clear',
            
            // Hospitals
            'hospitals_title': 'Nearby Hospitals & Medical Centers',
            'search_placeholder': 'Search for hospital, clinic or pharmacy...',
            'search_hospital_placeholder': 'Search for hospital or specialty...',
            'all_specialties': 'All Specialties',
            'cardiology': 'Cardiology',
            'orthopedics': 'Orthopedics',
            'pediatrics': 'Pediatrics',
            'nearby_hospitals': 'Nearby Hospitals',
            'results_found_8': 'Found 8 results in Benha',
            'filter_all': 'All',
            'filter_hospitals': 'Hospitals',
            'filter_clinics': 'Clinics',
            'filter_pharmacies': 'Pharmacies',
            'use_location': 'Use Current Location',
            
            // Chat
            'chat_title': 'Smart Medical Assistant',
            'chat_welcome': 'Hello! I am your smart medical assistant. How can I help you today?',
            'type_message': 'Type your message here...',
            'send': 'Send',
            'new_chat': 'New Chat',
            'chat_history_1': 'Back Pain Consultation',
            'chat_history_2': 'Flu Symptoms',
            'time_2h': '2 hours ago',
            'time_yesterday': 'Yesterday',
            'attach_file': 'Attach File',
            
            // Footer
            'quick_links': 'Quick Links',
            'our_services': 'Our Services',
            'contact_us': 'Contact Us',
            'about': 'About Us',
            'how_to_use': 'How to Use',
            'faq': 'FAQ',
            'help_center': 'Help Center',
            'terms': 'Terms & Conditions',
            'privacy_policy': 'Privacy Policy',
            'report': 'Report Issue',
            'tech_support': 'Technical Support',
            'copyright': 'All rights reserved © 2026 Symptom Diagnosis Platform. Design & Development ✨',
            'back_to_home': 'Back to Home',
            
            // Messages
            'settings_saved': 'Settings saved successfully!',
            'settings_reset': 'Settings reset',
            'settings_exported': 'Settings exported',
            'settings_imported': 'Settings imported successfully',
            'data_deleted': 'All data deleted',
            'cache_cleared': 'Cache cleared',
            'changes_cancelled': 'Changes cancelled',
            'error_import': 'Error importing file',
            'confirm_reset': '⚠️ Warning: Are you sure you want to reset all settings?',
            'confirm_delete': '⚠️ Warning: This action cannot be undone! Are you sure?',
            'default_user': 'User'
        }
    };
    
    // ============================================
    // تطبيق الثيم (Dark/Light Mode)
    // ============================================
    function applyTheme() {
        let theme = currentSettings.theme;
        
        // معالجة وضع "system"
        if (theme === 'system') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        // تطبيق الثيم على عنصر html
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }
        
        // تحديث أيقونة زر الثيم إذا كان موجوداً
        updateThemeToggleIcon(theme);
        
        console.log(`🎨 Theme applied: ${theme}`);
    }
    
    // تحديث أيقونة زر تبديل الثيم
    function updateThemeToggleIcon(currentTheme) {
        const themeToggle = document.getElementById('darkModeToggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        if (icon) {
            const theme = currentSettings.theme === 'system' 
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : currentSettings.theme;
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    // الاستماع لتغييرات الثيم من النظام
    function setupSystemThemeListener() {
        if (themeObserver) return;
        
        themeObserver = window.matchMedia('(prefers-color-scheme: dark)');
        themeObserver.addEventListener('change', (e) => {
            if (currentSettings.theme === 'system') {
                applyTheme();
            }
        });
    }
    
    // ============================================
    // تطبيق اللغة (i18n)
    // ============================================
    function applyLanguage() {
        const lang = currentSettings.language;
        
        // تغيير اتجاه الصفحة وخاصية lang
        if (lang === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', 'ar');
            document.body.style.direction = 'rtl';
            document.body.style.textAlign = 'right';
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', 'en');
            document.body.style.direction = 'ltr';
            document.body.style.textAlign = 'left';
        }
        
        // ترجمة جميع العناصر التي تحتوي على data-i18n
        translatePage(lang);
        
        console.log(`🌐 Language applied: ${lang}`);
    }
    
    // ترجمة الصفحة الحالية
    function translatePage(lang) {
        const elements = document.querySelectorAll('[data-i18n]');
        const t = translations[lang] || translations.ar;
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (t[key] !== undefined) {
                // الحفاظ على الأيقونات داخل العنصر
                const icon = element.querySelector('i');
                if (icon && element.children.length === 1) {
                    // إذا كان العنصر يحتوي على أيقونة فقط، نحافظ عليها
                    const newText = t[key];
                    if (element.textContent !== newText) {
                        element.innerHTML = `<i class="${icon.className}"></i> ${newText}`;
                    }
                } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    // للعناصر المدخلة
                    if (element.placeholder !== t[key]) {
                        element.placeholder = t[key];
                    }
                } else {
                    if (element.textContent !== t[key]) {
                        element.textContent = t[key];
                    }
                }
            }
        });
        
        // ترجمة عناصر خاصة مثل placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (translations[lang][key] !== undefined) {
                element.placeholder = translations[lang][key];
            }
        });
        
        // تحديث زر اللغة إذا كان موجوداً
        updateLanguageToggleButton(lang);
        
        // إطلاق حدث لتحديث المحتوى الديناميكي
        const event = new CustomEvent('languageChanged', { detail: { language: lang } });
        window.dispatchEvent(event);
    }
    
    // تحديث زر تبديل اللغة
    function updateLanguageToggleButton(lang) {
        const langToggle = document.getElementById('languageToggle');
        if (!langToggle) return;
        
        const icon = langToggle.querySelector('i');
        const span = langToggle.querySelector('span');
        if (icon) {
            icon.className = lang === 'ar' ? 'fas fa-language' : 'fas fa-globe';
        }
        if (span) {
            span.textContent = lang === 'ar' ? 'English' : 'العربية';
        }
    }
    
    // ============================================
    // تطبيق حجم الخط
    // ============================================
    function applyFontSize() {
        const root = document.documentElement;
        switch(currentSettings.fontSize) {
            case 'large':
                root.style.fontSize = '120%';
                break;
            case 'xlarge':
                root.style.fontSize = '140%';
                break;
            default:
                root.style.fontSize = '100%';
        }
        console.log(`🔤 Font size applied: ${currentSettings.fontSize}`);
    }
    
    // ============================================
    // تطبيق التباين العالي
    // ============================================
    function applyHighContrast() {
        if (currentSettings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }
    
    // ============================================
    // تطبيق إعدادات الرسوم المتحركة
    // ============================================
    function applyAnimations() {
        if (currentSettings.reduceAnimations) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
    }
    
    // ============================================
    // تطبيق جميع الإعدادات
    // ============================================
    function applyAllSettings() {
        applyTheme();
        applyLanguage();
        applyFontSize();
        applyHighContrast();
        applyAnimations();
        
        // إطلاق حدث لتحديث المكونات الأخرى
        const event = new CustomEvent('settingsApplied', { detail: { settings: currentSettings } });
        window.dispatchEvent(event);
        
        console.log('⚙️ All settings applied successfully');
    }
    
    // ============================================
    // تحميل الإعدادات من localStorage
    // ============================================
    function loadSettings() {
        try {
            const saved = localStorage.getItem('idos_global_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
                console.log('📁 Settings loaded from localStorage');
            } else {
                currentSettings = { ...DEFAULT_SETTINGS };
                console.log('📁 Using default settings');
            }
        } catch(e) {
            console.error('❌ Error loading settings:', e);
            currentSettings = { ...DEFAULT_SETTINGS };
        }
        
        initialized = true;
    }
    
    // ============================================
    // حفظ الإعدادات في localStorage
    // ============================================
    function saveSettings() {
        try {
            localStorage.setItem('idos_global_settings', JSON.stringify(currentSettings));
            console.log('💾 Settings saved to localStorage');
            return true;
        } catch(e) {
            console.error('❌ Error saving settings:', e);
            return false;
        }
    }
    
    // ============================================
    // تحديث إعداد معين
    // ============================================
    function updateSetting(key, value) {
        if (currentSettings.hasOwnProperty(key)) {
            currentSettings[key] = value;
            saveSettings();
            
            // تطبيق الإعدادات ذات الصلة
            switch(key) {
                case 'theme':
                    applyTheme();
                    break;
                case 'language':
                    applyLanguage();
                    break;
                case 'fontSize':
                    applyFontSize();
                    break;
                case 'highContrast':
                    applyHighContrast();
                    break;
                case 'reduceAnimations':
                    applyAnimations();
                    break;
            }
            
            // إطلاق حدث لتحديث الإعداد
            const event = new CustomEvent('settingChanged', { detail: { key, value } });
            window.dispatchEvent(event);
            
            console.log(`🔄 Setting updated: ${key} = ${value}`);
            return true;
        }
        return false;
    }
    
    // ============================================
    // الحصول على إعداد معين
    // ============================================
    function getSetting(key) {
        return currentSettings[key];
    }
    
    // ============================================
    // الحصول على جميع الإعدادات
    // ============================================
    function getAllSettings() {
        return { ...currentSettings };
    }
    
    // ============================================
    // إعادة تعيين جميع الإعدادات
    // ============================================
    function resetSettings() {
        currentSettings = { ...DEFAULT_SETTINGS };
        saveSettings();
        applyAllSettings();
        console.log('🔄 Settings reset to defaults');
        return true;
    }
    
    // ============================================
    // إدارة القائمة الجانبية (Sidebar)
    // ============================================
    function setupSidebar() {
        // لا تظهر القائمة في صفحة تسجيل الدخول
        const path = window.location.pathname;
        const isLoginPage = path.endsWith('index.html') || (path.endsWith('/') && !path.includes('home.html') && !path.includes('diagnosis.html') && !path.includes('chat.html') && !path.includes('hospitals.html') && !path.includes('settings.html'));
        
        if (isLoginPage && !path.includes('home.html')) return;
        
        // الحصول على بيانات المستخدم من الجلسة
        let userData = { name: 'مستخدم', avatar: 'م' };
        try {
            const session = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
            if (session) {
                const parsed = JSON.parse(session);
                userData.name = parsed.name || 'مستخدم';
                userData.avatar = userData.name.charAt(0).toUpperCase();
            }
        } catch (e) {
            console.error('Error getting session for sidebar:', e);
        }

        // إنشاء الهيكل إذا لم يكن موجوداً
        if (!document.getElementById('idosSidebar')) {
            const sidebarHTML = `
                <div class="sidebar-overlay" id="sidebarOverlay"></div>
                <div class="sidebar" id="idosSidebar">
                    <div class="sidebar-header">
                        <a href="home.html" class="logo">
                            <i class="fas fa-stethoscope logo-icon"></i>
                            <span class="logo-text" data-i18n="logo">IDOS</span>
                        </a>
                        <div class="sidebar-close" id="sidebarClose">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    
                    <div class="sidebar-user" id="sidebarUser">
                        <div class="sidebar-user-avatar" id="sidebarAvatar">${userData.avatar}</div>
                        <div class="sidebar-user-info">
                            <span class="sidebar-user-welcome" data-i18n="welcome">مرحباً بك</span>
                            <span class="sidebar-user-name" id="sidebarName">${userData.name}</span>
                        </div>
                    </div>
                    
                    <ul class="sidebar-menu">
                        <li><a href="home.html" class="sidebar-link ${path.includes('home.html') ? 'active' : ''}">
                            <i class="fas fa-home"></i> <span data-i18n="home">الرئيسية</span>
                        </a></li>
                        <li><a href="diagnosis.html" class="sidebar-link ${path.includes('diagnosis.html') ? 'active' : ''}">
                            <i class="fas fa-microscope"></i> <span data-i18n="diagnosis">التشخيص</span>
                        </a></li>
                        <li><a href="chat.html" class="sidebar-link ${path.includes('chat.html') ? 'active' : ''}">
                            <i class="fas fa-robot"></i> <span data-i18n="chat">محادثة AI</span>
                        </a></li>
                        <li><a href="hospitals.html" class="sidebar-link ${path.includes('hospitals.html') ? 'active' : ''}">
                            <i class="fas fa-hospital"></i> <span data-i18n="hospitals">المستشفيات</span>
                        </a></li>
                        <li><a href="settings.html" class="sidebar-link ${path.includes('settings.html') ? 'active' : ''}">
                            <i class="fas fa-cog"></i> <span data-i18n="settings">الإعدادات</span>
                        </a></li>
                        
                        <li style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                            <div class="lang-switcher-global" id="globalLangToggle">
                                <i class="fas fa-language"></i>
                                <span id="globalLangText">${currentSettings.language === 'ar' ? 'English' : 'العربية'}</span>
                            </div>
                        </li>
                        
                        <li><a href="#" class="sidebar-link logout" id="sidebarLogout">
                            <i class="fas fa-sign-out-alt"></i> <span data-i18n="logout">تسجيل الخروج</span>
                        </a></li>
                    </ul>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', sidebarHTML);
        }

        const sidebar = document.getElementById('idosSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const closeBtn = document.getElementById('sidebarClose');
        const logoutBtn = document.getElementById('sidebarLogout');
        const langToggle = document.getElementById('globalLangToggle');

        // وظائف الفتح والإغلاق
        window.toggleSidebar = function() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        };

        closeBtn?.addEventListener('click', window.toggleSidebar);
        overlay?.addEventListener('click', window.toggleSidebar);
        
        // تسجيل الخروج
        logoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof logout === 'function') {
                logout();
            } else {
                localStorage.removeItem('userSession');
                sessionStorage.removeItem('userSession');
                window.location.href = 'index.html';
            }
        });

        // تبديل اللغة من القائمة
        langToggle?.addEventListener('click', () => {
            const newLang = currentSettings.language === 'ar' ? 'en' : 'ar';
            updateSetting('language', newLang);
            if (document.getElementById('globalLangText')) {
                document.getElementById('globalLangText').textContent = newLang === 'ar' ? 'English' : 'العربية';
            }
        });

        // تبديل اللغة من صفحة تسجيل الدخول (إذا وجد الزر)
        const authLangToggle = document.getElementById('authLangToggle');
        if (authLangToggle) {
            document.getElementById('authLangText').textContent = currentSettings.language === 'ar' ? 'English' : 'العربية';
        }
        authLangToggle?.addEventListener('click', () => {
            const newLang = currentSettings.language === 'ar' ? 'en' : 'ar';
            updateSetting('language', newLang);
            if (document.getElementById('authLangText')) {
                document.getElementById('authLangText').textContent = newLang === 'ar' ? 'English' : 'العربية';
            }
        });

        // ربط جميع أزرار الـ toggle الموجودة في الصفحة
        document.querySelectorAll('.menu-toggle, .user-profile-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // منع الانتقال لصفحة أخرى إذا كان الزر في الأساس رابط (مثل settings.html)
                // إلا لو كان المستخدم يريد فعلاً الانتقال لصفحة الإعدادات.
                // في حالتنا، زر الهيدر فقط يفتح القائمة.
                if (btn.classList.contains('user-profile-btn')) {
                    e.preventDefault();
                }
                window.toggleSidebar();
            });
        });
        
        // ترجمة القائمة فوراً
        translatePage(currentSettings.language);
    }

    // ============================================
    // تهيئة النظام
    // ============================================
    function init() {
        if (initialized) return;
        
        loadSettings();
        setupSystemThemeListener();
        applyAllSettings();
        setupSidebar(); // تهيئة القائمة الجانبية
        
        // إضافة مستمع لتغييرات الثيم من النظام
        if (themeObserver) {
            themeObserver.addEventListener('change', () => {
                if (currentSettings.theme === 'system') {
                    applyTheme();
                }
            });
        }
        
        console.log('🚀 Global Settings System initialized');
    }
    
    // ============================================
    // واجهة عامة للاستخدام
    // ============================================
    return {
        init,
        applyAllSettings,
        getSetting,
        getAllSettings,
        updateSetting,
        saveSettings,
        resetSettings,
        get translations() { return translations; },
        get currentLanguage() { return currentSettings.language; },
        get currentTheme() { return currentSettings.theme; },
        get isInitialized() { return initialized; }
    };
})();

// ============================================
// تهيئة النظام عند تحميل الصفحة
// ============================================
(function() {
    // تهيئة فورية
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            GlobalSettings.init();
        });
    } else {
        GlobalSettings.init();
    }
    
    // دالة مساعدة لتطبيق الإعدادات على العناصر الديناميكية
    window.applyGlobalSettings = function() {
        GlobalSettings.applyAllSettings();
    };
})();