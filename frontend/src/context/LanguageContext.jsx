import React, { createContext, useState, useContext } from "react";

const translations = {
  RU: {
    // --- НАВИГАЦИЯ ---
    nav_home: "Главная",
    nav_tests: "Мои тесты",
    nav_login: "Войти",
    nav_logout: "Выйти",
    nav_admin: "Админ-панель",
    section_exams: "ЭКЗАМЕНЫ",
    section_admin: "АДМИНИСТРИРОВАНИЕ",

    // --- АВТОРИЗАЦИЯ (AUTH) ---
    auth_welcome: "С возвращением!",
    auth_register: "Регистрация",
    auth_sub_login: "Войдите, чтобы продолжить подготовку",
    auth_sub_register: "Создайте аккаунт за пару минут",
    auth_fullname: "ФИО",
    auth_phone: "Телефон",
    auth_school: "Школа",
    auth_class: "Класс",
    auth_email: "Email",
    auth_password: "Пароль",
    auth_consent: "Я согласен на обработку персональных данных",
    auth_btn_login: "Войти",
    auth_btn_register: "Создать аккаунт",
    auth_btn_create: "Создать",
    auth_no_account: "Нет аккаунта?",
    auth_have_account: "Уже есть аккаунт?",
    auth_loading: "Загрузка...",
    auth_2fa_title: "Проверка 2FA",
    auth_2fa_sub: "Введите код из Telegram бота",
    auth_verify: "Подтвердить",

    // --- МОДАЛЬНЫЕ ОКНА И ОШИБКИ ---
    no_data: "Нет данных",
    modal_error: "Ошибка",
    modal_success: "Успешно",
    modal_btn_ok: "Понятно",
    modal_security: "Проверка безопасности",
    modal_2fa_sent: "Код подтверждения отправлен в Telegram.",

    // --- ДАШБОРД (DASHBOARD) ---
    dash_loading: "Загрузка системы...",
    dash_hello: "Привет",
    dash_sub_home: "Готов к новым достижениям?",
    dash_sub_tests: "Продолжи своё обучение",
    dash_sub_prep: "Подготовка к",

    hero_badge: "Официальная платформа",
    hero_title: "Твой путь к успеху",
    hero_text:
      "Современная платформа для подготовки к экзаменам. Выбери направление и начни прямо сейчас.",
    hero_stat_exam: "Экзамена",
    hero_stat_test: "Тестов",

    cat_select: "Выбери экзамен",
    cat_sub: "Начни подготовку к важным тестам",
    cat_ent_desc: "Единое национальное тестирование",
    cat_modo_desc: "Мониторинг образовательных достижений",
    cat_pisa_desc: "Международная программа оценки",

    stat_finished: "Завершено",
    stat_in_progress: "В процессе",
    stat_waiting: "Ожидает",

    hist_title: "История тестирования",
    hist_sub: "Ваш прогресс и результаты",
    other_tests: "Другие тесты",
    empty_title: "Нет активных тестов",
    empty_text:
      "У вас пока нет начатых тестов. Выберите экзамен и начните подготовку!",
    btn_choose_exam: "Выбрать экзамен",

    // --- КАРТОЧКИ ТЕСТОВ ---
    card_status_done: "Сдано",
    card_status_process: "В процессе",
    card_status_wait: "Ожидает",
    card_status_active: "Активен",
    card_score: "баллов",
    btn_result: "Смотреть результат",
    btn_continue: "Продолжить",
    btn_start: "Начать тест",

    // --- УВЕДОМЛЕНИЯ (TOASTS) ---
    toast_load_err: "Не удалось загрузить данные дашборда",
    toast_finished: "Тест уже сдан. Результат на карточке!",
    toast_prep: "Подготовка теста...",
    toast_started: "Тест запущен! Удачи 🚀",
    toast_err_start: "Ошибка при запуске теста",
    toast_err_connect: "Не удалось соединиться с сервером",

    // --- СТРАНИЦЫ (ENT, MODO, PISA) ---
    ent_banner_title: "ЕНТ Тестирование",
    ent_banner_desc: "Единое Национальное Тестирование для поступления в ВУЗы.",
    subjects_avail: "Доступные предметы",
    ent_empty: "Тесты ЕНТ пока не добавлены.",

    modo_title: "МОДО",
    modo_banner_desc: "Мониторинг Образовательных Достижений Обучающихся.",
    modo_tests_title: "Тесты МОДО",
    btn_start_modo: "Начать МОДО",
    modo_empty: "Тесты МОДО пока не добавлены.",

    pisa_title: "PISA",
    pisa_banner_desc:
      "Международная программа по оценке образовательных достижений.",
    pisa_section_title: "Международные тесты",
    btn_start_pisa: "Начать PISA",
    pisa_empty: "Тесты PISA пока не добавлены.",
    nav_profile: "Профиль",
  },

  KZ: {
    // --- НАВИГАЦИЯ ---
    nav_home: "Басты бет",
    nav_tests: "Менің тестерім",
    nav_login: "Кіру",
    nav_logout: "Шығу",
    nav_admin: "Админ-панель",
    section_exams: "ЕМТИХАНДАР",
    section_admin: "ӘКІМШІЛІК",

    // --- АВТОРИЗАЦИЯ ---
    auth_welcome: "Қайта қош келдіңіз!",
    auth_register: "Тіркелу",
    auth_sub_login: "Дайындықты жалғастыру үшін кіріңіз",
    auth_sub_register: "Бірнеше минут ішінде тіркеліңіз",
    auth_fullname: "Аты-жөні",
    auth_phone: "Телефон",
    auth_school: "Мектеп",
    auth_class: "Сынып",
    auth_email: "Email",
    auth_password: "Құпия сөз",
    auth_consent: "Дербес деректерді өңдеуге келісемін",
    auth_btn_login: "Кіру",
    auth_btn_register: "Тіркелу",
    auth_btn_create: "Тіркелу",
    auth_no_account: "Аккаунт жоқ па?",
    auth_have_account: "Аккаунт бар ма?",
    auth_loading: "Жүктелуде...",
    auth_2fa_title: "2FA Тексеру",
    auth_2fa_sub: "Telegram-боттан кодты енгізіңіз",
    auth_verify: "Растау",

    // --- МОДАЛЬНЫЕ ОКНА ---
    no_data: "Деректер жоқ",
    modal_error: "Қате",
    modal_success: "Сәтті",
    modal_btn_ok: "Түсінікті",
    modal_security: "Қауіпсіздікті тексеру",
    modal_2fa_sent: "Растау коды Telegram-ға жіберілді.",

    // --- ДАШБОРД ---
    dash_loading: "Жүйе жүктелуде...",
    dash_hello: "Сәлем",
    dash_sub_home: "Жаңа жетістіктерге дайынсыз ба?",
    dash_sub_tests: "Оқуды жалғастырыңыз",
    dash_sub_prep: "Дайындық:",

    hero_badge: "Ресми платформа",
    hero_title: "Жетістікке жол",
    hero_text:
      "Емтихандарға дайындалуға арналған заманауи платформа. Бағытты таңдап, қазір бастаңыз.",
    hero_stat_exam: "Емтихан",
    hero_stat_test: "Тест",

    cat_select: "Емтиханды таңдаңыз",
    cat_sub: "Маңызды сынақтарға дайындықты бастаңыз",
    cat_ent_desc: "Ұлттық бірыңғай тестілеу",
    cat_modo_desc: "Білім беру жетістіктерінің мониторингі",
    cat_pisa_desc: "Халықаралық бағалау бағдарламасы",

    stat_finished: "Аяқталды",
    stat_in_progress: "Орындалуда",
    stat_waiting: "Күтуде",

    hist_title: "Тестілеу тарихы",
    hist_sub: "Сіздің прогресс пен нәтижелер",
    other_tests: "Басқа тестер",
    empty_title: "Белсенді тесттер жоқ",
    empty_text:
      "Сізде әзірге басталған тесттер жоқ. Емтиханды таңдап, дайындықты бастаңыз!",
    btn_choose_exam: "Емтихан таңдау",

    // --- КАРТОЧКИ ---
    card_status_done: "Тапсырылды",
    card_status_process: "Орындалуда",
    card_status_wait: "Күтуде",
    card_status_active: "Белсенді",
    card_score: "ұпай",
    btn_result: "Нәтижені көру",
    btn_continue: "Жалғастыру",
    btn_start: "Тестті бастау",

    // --- УВЕДОМЛЕНИЯ ---
    toast_load_err: "Деректерді жүктеу мүмкін болмады",
    toast_finished: "Тест тапсырылған. Нәтиже картада!",
    toast_prep: "Тест дайындалуда...",
    toast_started: "Тест іске қосылды! Сәттілік 🚀",
    toast_err_start: "Тестті бастау қатесі",
    toast_err_connect: "Сервермен байланыс орнатылмады",

    // --- СТРАНИЦЫ ---
    ent_banner_title: "ҰБТ Тестілеу",
    ent_banner_desc: "ЖОО-ға түсуге арналған Ұлттық бірыңғай тестілеу.",
    subjects_avail: "Қолжетімді пәндер",
    ent_empty: "ҰБТ тесттері әзірге қосылмаған.",

    modo_title: "МОДО",
    modo_banner_desc: "Білім беру жетістіктерінің мониторингі.",
    modo_tests_title: "МОДО тесттері",
    btn_start_modo: "МОДО бастау",
    modo_empty: "МОДО тесттері әзірге қосылмаған.",

    pisa_title: "PISA",
    pisa_banner_desc:
      "Оқушылардың білім жетістіктерін бағалаудың халықаралық бағдарламасы.",
    pisa_section_title: "Халықаралық тесттер",
    btn_start_pisa: "PISA бастау",
    pisa_empty: "PISA тесттері әзірге қосылмаған.",
    nav_profile: "Профиль",
  },

  EN: {
    // --- NAV ---
    nav_home: "Home",
    nav_tests: "My Tests",
    nav_login: "Login",
    nav_logout: "Logout",
    nav_admin: "Admin Panel",
    section_exams: "EXAMS",
    section_admin: "ADMINISTRATION",

    // --- AUTH ---
    auth_welcome: "Welcome back!",
    auth_register: "Sign Up",
    auth_sub_login: "Login to continue your preparation",
    auth_sub_register: "Create an account in a few minutes",
    auth_fullname: "Full Name",
    auth_phone: "Phone",
    auth_school: "School",
    auth_class: "Grade",
    auth_email: "Email",
    auth_password: "Password",
    auth_consent: "I agree to personal data processing",
    auth_btn_login: "Login",
    auth_btn_register: "Create Account",
    auth_btn_create: "Create",
    auth_no_account: "No account?",
    auth_have_account: "Already have an account?",
    auth_loading: "Loading...",
    auth_2fa_title: "2FA Verification",
    auth_2fa_sub: "Enter code from Telegram bot",
    auth_verify: "Verify",

    // --- MODALS ---
    no_data: "No data",
    modal_error: "Error",
    modal_success: "Success",
    modal_btn_ok: "Got it",
    modal_security: "Security Check",
    modal_2fa_sent: "Verification code sent to Telegram.",

    // --- DASHBOARD ---
    dash_loading: "System loading...",
    dash_hello: "Hello",
    dash_sub_home: "Ready for new achievements?",
    dash_sub_tests: "Continue your learning",
    dash_sub_prep: "Preparation for",

    hero_badge: "Official Platform",
    hero_title: "Your path to success",
    hero_text:
      "Modern platform for exam preparation. Choose a direction and start right now.",
    hero_stat_exam: "Exams",
    hero_stat_test: "Tests",

    cat_select: "Choose an exam",
    cat_sub: "Start preparing for important tests",
    cat_ent_desc: "Unified National Testing",
    cat_modo_desc: "Monitoring of Educational Achievements",
    cat_pisa_desc: "Programme for International Student Assessment",

    stat_finished: "Completed",
    stat_in_progress: "In Progress",
    stat_waiting: "Waiting",

    hist_title: "Testing History",
    hist_sub: "Your progress and results",
    other_tests: "Other Tests",
    empty_title: "No active tests",
    empty_text:
      "You have no started tests yet. Choose an exam and start preparing!",
    btn_choose_exam: "Choose Exam",

    // --- CARDS ---
    card_status_done: "Done",
    card_status_process: "In Progress",
    card_status_wait: "Waiting",
    card_status_active: "Active",
    card_score: "points",
    btn_result: "View Result",
    btn_continue: "Continue",
    btn_start: "Start Test",

    // --- TOASTS ---
    toast_load_err: "Failed to load dashboard data",
    toast_finished: "Test already finished. Result on card!",
    toast_prep: "Preparing test...",
    toast_started: "Test started! Good luck 🚀",
    toast_err_start: "Error starting test",
    toast_err_connect: "Failed to connect to server",

    // --- PAGES ---
    ent_banner_title: "ENT Testing",
    ent_banner_desc: "Unified National Testing for university admission.",
    subjects_avail: "Available Subjects",
    ent_empty: "ENT tests not added yet.",

    modo_title: "MODO",
    modo_banner_desc: "Monitoring of Educational Achievements of Students.",
    modo_tests_title: "MODO Tests",
    btn_start_modo: "Start MODO",
    modo_empty: "MODO tests not added yet.",

    pisa_title: "PISA",
    pisa_banner_desc: "Programme for International Student Assessment.",
    pisa_section_title: "International Tests",
    btn_start_pisa: "Start PISA",
    pisa_empty: "PISA tests not added yet.",
    nav_profile: "Profile",
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem("appLang") || "RU"
  );

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem("appLang", code);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
