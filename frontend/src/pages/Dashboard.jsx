import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  
  const tests = [
    { id: 1, title: "Математика (Контрольная)", duration: "45 мин" },
    { id: 2, title: "Программирование React", duration: "60 мин" },
  ];

  return (
    <div>
      <h2>Доступные тесты</h2>
      <div style={{ display: "grid", gap: "10px", marginTop: "20px" }}>
        {tests.map(test => (
          <div key={test.id} style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
            <h3>{test.title}</h3>
            <p>Время: {test.duration}</p>
            <button onClick={() => navigate(`/test/${test.id}`)}>Начать тест</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;