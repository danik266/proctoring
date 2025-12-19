import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Импорт страниц
import Dashboard from "./pages/Dashboard";
import TestPage from "./pages/TestPage"; // Убедись, что файл называется так
import AdminPanel from "./pages/AdminPanel";
import Navbar from "./components/Navbar";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";

// Обертка для защиты приватных страниц
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  // Если токена нет, перекидываем на авторизацию
  return token ? children : <Navigate to="/auth" replace />;
};

// Компонент Layout для управления отображением Navbar
const Layout = ({ children }) => {
  const location = useLocation(); // Объявляем только один раз!

  // Список путей, где Navbar НЕ должен отображаться
  // Добавь сюда "/dashboard" или "/admin", если там есть свои меню
  const hideNavbarPaths = ["/", "/auth"]; 
  
  // Проверяем: если текущий путь НЕ в списке скрытых, показываем навбар
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {shouldShowNavbar && <Navbar />}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Приватные маршруты (доступны только с токеном) */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
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
  );
}

export default App;