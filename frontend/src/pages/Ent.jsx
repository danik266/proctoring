import React from "react";

const EntPage = ({ tests, onStart }) => {
  // Фильтрация (предполагаем, что backend не фильтрует, делаем это здесь)
  // Если у тестов нет поля 'category', можно фильтровать по имени или subject
  // const entTests = tests.filter(t => t.subject === 'ent' || t.name.includes('ЕНТ'));

  // ПОКА ОСТАВЛЯЮ ВСЕ ТЕСТЫ, разблокируй фильтр выше, если есть поле
  const displayTests = tests;

  return (
    <div className="fade-in">
      {/* Специальный баннер для ЕНТ */}
      <div
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          borderRadius: "32px",
          padding: "40px",
          color: "#fff",
          marginBottom: "40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "800",
              marginBottom: "10px",
            }}
          >
            ЕНТ Тестирование
          </h2>
          <p style={{ opacity: 0.9 }}>
            Единое Национальное Тестирование для поступления в ВУЗы.
          </p>
        </div>
        <div style={{ fontSize: "80px" }}>🎓</div>
      </div>

      <h3
        style={{
          fontSize: "22px",
          fontWeight: "800",
          color: "#1e293b",
          marginBottom: "20px",
        }}
      >
        Доступные предметы
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "30px",
        }}
      >
        {displayTests.map((test) => {
          const isFinished = !!test.end_time;
          const isStarted = !!test.start_time && !test.end_time;
          return (
            <div
              key={test.id}
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "28px",
                border: "1px solid #f1f5f9",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-5px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <span style={{ fontSize: "26px" }}>📐</span>
                <span
                  style={{
                    padding: "6px 14px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "800",
                    background: isFinished ? "#dcfce7" : "#f1f5f9",
                    color: isFinished ? "#166534" : "#475569",
                  }}
                >
                  {isFinished ? "Сдано" : "Активен"}
                </span>
              </div>
              <h4
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#1e293b",
                  margin: "0 0 6px 0",
                }}
              >
                {test.name}
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  color: "#94a3b8",
                  fontWeight: "600",
                  marginBottom: "20px",
                }}
              >
                {test.subject}
              </p>

              <button
                onClick={() => onStart(test.id, isFinished)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "none",
                  background: "#3b82f6",
                  color: "#fff",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {isFinished ? "Результат" : "Начать тест"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EntPage;
