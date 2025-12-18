import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TestPage from "./pages/ENTTestPage"; 
import Navbar from "./components/Navbar";
import Auth from "./pages/Auth";

// Обертка для защиты страниц
const PrivateRoute = ({ children }) => {
  return localStorage.getItem("token") ? children : <Navigate to="/auth" />;
};

function App() {
  return (
    <Router>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/test/:id" element={<PrivateRoute><TestPage /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;