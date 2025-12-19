import React from "react";

const PisaPage = ({ tests, onStart }) => {
  const displayTests = tests;

  return (
    <div className="fade-in">
      <div
        style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
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
            PISA
          </h2>
          <p style={{ opacity: 0.9 }}>
            Международная программа по оценке образовательных достижений.
          </p>
        </div>
        <div style={{ fontSize: "80px" }}>🌍</div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "30px",
        }}
      >
        {displayTests.map((test) => (
          <div
            key={test.id}
            style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "28px",
              border: "1px solid #f1f5f9",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "26px" }}>🇬🇧</span>
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "800",
                  background: "#f1f5f9",
                  color: "#475569",
                }}
              >
                Международный
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
            <button
              onClick={() => onStart(test.id, !!test.end_time)}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "none",
                background: "#8b5cf6",
                color: "#fff",
                fontWeight: "700",
                cursor: "pointer",
                marginTop: "20px",
              }}
            >
              Начать PISA
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PisaPage;
