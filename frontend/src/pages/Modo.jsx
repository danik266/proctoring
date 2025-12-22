import React from "react";
// 1. Импортируем хук
import { useLanguage } from "../context/LanguageContext";

const ModoPage = ({ tests = [], onStart }) => {
  // 2. Достаем функцию перевода
  const { t } = useLanguage();

  const displayTests = tests.filter(
    (test) =>
      test.type &&
      test.type.trim().toUpperCase() === "MODO" &&
      test.published === true
  );

  return (
    <div className="fade-in">
      {/* БАННЕР */}
      <div style={styles.bannerGreen}>
        <div style={styles.bannerGlow}></div>
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Перевод заголовка и описания */}
          <h2 style={styles.bannerTitle}>{t("modo_title")}</h2>
          <p style={styles.bannerText}>{t("modo_banner_desc")}</p>
        </div>
        <div style={styles.emoji}>📊</div>
      </div>

      {/* Перевод заголовка секции */}
      <h3 style={styles.sectionTitle}>{t("modo_tests_title")}</h3>

      <div style={styles.grid}>
        {displayTests.length > 0 ? (
          displayTests.map((test) => {
            const isFinished = !!test.end_time;
            return (
              <div key={test.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconBoxGreen}>📜</div>
                  <span
                    style={
                      isFinished ? styles.badgeSuccess : styles.badgeActive
                    }
                  >
                    {/* Используем общие ключи статусов */}
                    {isFinished
                      ? t("card_status_done")
                      : t("card_status_active")}
                  </span>
                </div>
                <h4 style={styles.cardTitle}>{test.name}</h4>
                <p style={styles.cardSubject}>{test.subject}</p>
                <button
                  onClick={() => onStart(test.id, isFinished)}
                  style={styles.btnGreen}
                >
                  {/* Перевод кнопок */}
                  {isFinished ? t("btn_result") : t("btn_start_modo")}
                </button>
              </div>
            );
          })
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
            {/* Перевод пустого состояния */}
            {t("modo_empty")}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  bannerGreen: {
    background:
      "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    borderRadius: "24px",
    padding: "40px",
    color: "#fff",
    marginBottom: "40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  bannerGlow: {
    position: "absolute",
    top: "-50%",
    right: "-10%",
    width: "300px",
    height: "300px",
    background:
      "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)",
    filter: "blur(40px)",
  },
  bannerTitle: {
    fontSize: "32px",
    fontWeight: "800",
    margin: "0 0 10px 0",
    color: "#fff",
  },
  bannerText: { fontSize: "16px", color: "#94a3b8", margin: 0 },
  emoji: { fontSize: "80px", position: "relative", zIndex: 1 },

  sectionTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "25px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
  },

  card: {
    background: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(10px)",
    padding: "28px",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  iconBoxGreen: {
    fontSize: "24px",
    background: "rgba(16, 185, 129, 0.2)",
    color: "#34d399",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    border: "1px solid rgba(16, 185, 129, 0.3)",
  },

  badgeActive: {
    padding: "6px 12px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "700",
    background: "rgba(255, 255, 255, 0.1)",
    color: "#94a3b8",
    height: "fit-content",
  },
  badgeSuccess: {
    padding: "6px 12px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "700",
    background: "rgba(16, 185, 129, 0.2)",
    color: "#34d399",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    height: "fit-content",
  },

  cardTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 8px 0",
  },
  cardSubject: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "24px",
    flex: 1,
  },

  btnGreen: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
  },

  emptyState: {
    gridColumn: "1 / -1",
    background: "rgba(255,255,255,0.02)",
    border: "1px dashed rgba(255,255,255,0.1)",
    borderRadius: "20px",
    padding: "40px",
    textAlign: "center",
    color: "#94a3b8",
  },
};

export default ModoPage;
