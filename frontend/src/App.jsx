// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TestPage from "./pages/ENTTestPage"; 
import Navbar from "./components/Navbar";
import Auth from "./pages/Auth"

function App() {
  return (
    <Router>
      <Navbar />
      <Auth />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* Параметр :id обязателен, чтобы поймать /test/1, /test/2 и т.д. */}
        <Route path="/test/:id" element={<TestPage />} />
      </Routes>
    </Router>
  );
}

export default App;