import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// --- ВАЖНО: Импорт провайдера языка ---
import { LanguageProvider } from "./context/LanguageContext";

// Импорт страниц
import Dashboard from "./pages/Dashboard";
import TestPage from "./pages/TestPage";
import AdminPanel from "./pages/AdminPanel";
import Navbar from "./components/Navbar";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import TeamPage from "./pages/TeamPage";
// --- ДОБАВЛЕН ИМПОРТ ПРОФИЛЯ ---
import ProfilePage from "./pages/ProfilePage";

// Обертка для защиты приватных страниц
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  // Если токена нет, перекидываем на авторизацию
  return token ? children : <Navigate to="/auth" replace />;
};

// Компонент Layout для управления отображением Navbar
const Layout = ({ children }) => {
  const location = useLocation();

  // Список путей, где Navbar НЕ должен отображаться
  // Добавляем сюда "/profile", так как ProfilePage сам рисует свой Navbar
  const hideNavbarPaths = ["/", "/auth", "/team", "/profile"];

  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {shouldShowNavbar && <Navbar />}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};

function App() {
  return (
    /* Оборачиваем все приложение в LanguageProvider, 
       чтобы язык работал везде */
    <LanguageProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/team" element={<TeamPage />} />

            {/* Приватные маршруты (доступны только с токеном) */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* --- ДОБАВЛЕН МАРШРУТ ПРОФИЛЯ --- */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            {/* -------------------------------- */}

            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminPanel />
                </PrivateRoute>
              }
            />

            <Route
              path="/test/:id"
              element={
                <PrivateRoute>
                  <TestPage />
                </PrivateRoute>
              }
            />

            {/* Если страница не найдена — редирект на главную */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </LanguageProvider>
  );
}

export default App;
