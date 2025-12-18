import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      <h2>Добро пожаловать в систему прокторинга</h2>
      <Link to="/auth">Войти, чтобы начать тест</Link>
    </div>
  );
};

export default Home;