import React from "react";
import { useLanguage } from "../context/LanguageContext";

const PisaPage = ({ tests = [], onStart }) => {
  const { t } = useLanguage();

  const displayTests = tests.filter(
    (test) =>
      test.type &&
      test.type.trim().toUpperCase() === "PISA" &&
      test.published === true
  );

  return (
    <div className="fade-in">
      <div style={styles.bannerPurple}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={styles.bannerTitle}>{t("pisa_title")}</h2>
          <p style={styles.bannerText}>{t("pisa_banner_desc")}</p>
        </div>
        <div style={styles.emoji}>🌍</div>
      </div>

      <h3 style={styles.sectionTitle}>{t("pisa_section_title")}</h3>

      <div style={styles.grid}>
        {displayTests.length > 0 ? (
          displayTests.map((test) => {
            const isFinished = !!test.end_time;
            return (
              <div key={test.id} style={styles.card} className="card-hover">
                <div style={{ flexGrow: 1 }}>
                    <div style={styles.cardHeader}>
                    <div style={styles.iconBoxPurple}>🌐</div>
                    <span
                        style={
                        isFinished ? styles.badgeSuccess : styles.badgeActive
                        }
                    >
                        {isFinished
                        ? t("card_status_done")
                        : t("card_status_active")}
                    </span>
                    </div>
                    <h4 style={styles.cardTitle}>{test.name}</h4>
                    <p style={styles.cardSubject}>{test.subject}</p>
                </div>
                <button
                  onClick={() => onStart(test.id, isFinished)}
                  style={styles.btnPurple}
                >
                  {isFinished ? t("btn_result") : t("btn_start_pisa")}
                </button>
              </div>
            );
          })
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
            {t("pisa_empty")}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  bannerPurple: {
    background: "#f5f3ff", // Светло-фиолетовый
    border: "1px solid #ede9fe",
    borderRadius: "24px",
    padding: "40px",
    color: "#5b21b6",
    marginBottom: "40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  bannerTitle: { fontSize: "32px", fontWeight: "800", margin: "0 0 10px 0", color: "#4c1d95" },
  bannerText: { fontSize: "16px", color: "#8b5cf6", margin: 0, fontWeight: "500" },
  emoji: { fontSize: "80px", position: "relative", zIndex: 1 },

  sectionTitle: { fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "25px" },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
    alignItems: "stretch"
  },

  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "24px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    height: "100%"
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },

  iconBoxPurple: {
    fontSize: "24px",
    background: "#f5f3ff",
    color: "#8b5cf6",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
  },

  badgeActive: { padding: "6px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", background: "#f1f5f9", color: "#64748b", height: "fit-content" },
  badgeSuccess: { padding: "6px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", background: "#ecfdf5", color: "#10b981", height: "fit-content" },

  cardTitle: { fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" },
  cardSubject: { fontSize: "14px", color: "#64748b", marginBottom: "24px" },

  btnPurple: {
    width: "100%",
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "#8b5cf6",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
    marginTop: "auto"
  },

  emptyState: {
    gridColumn: "1 / -1",
    background: "#fff",
    border: "1px dashed #cbd5e1",
    borderRadius: "20px",
    padding: "40px",
    textAlign: "center",
    color: "#94a3b8",
  },
};

export default PisaPage;