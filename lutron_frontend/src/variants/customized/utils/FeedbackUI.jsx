//trigger popup
import React from "react";

// ConfirmDialog
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmDisabled }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(2px)"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "32px 40px",
        minWidth: 400,
        maxWidth: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        border: "1px solid rgba(0,0,0,0.1)",
        animation: "dialogFadeIn 0.2s ease-out"
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: 24,
          marginBottom: 16,
          color: "#232323",
          textAlign: "center"
        }}>
          {title}
        </div>
        <div style={{
          marginBottom: 32,
          fontSize: 16,
          color: "#666",
          textAlign: "center",
          lineHeight: 1.5
        }}>
          {message}
        </div>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 16
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: "12px 32px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#f8f9fa",
              color: "#666",
              fontSize: 16,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              minWidth: 100
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#e9ecef";
              e.target.style.borderColor = "#adb5bd";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#f8f9fa";
              e.target.style.borderColor = "#ddd";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}   // disable button
            style={{
              padding: "12px 32px",
              borderRadius: 8,
              border: "none",
              background: confirmDisabled ? "#999" : "#232323", // gray when loading
              color: "#fff",
              fontSize: 16,
              fontWeight: 500,
              cursor: confirmDisabled ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              minWidth: 100
            }}
          >
            {confirmDisabled ? "Deleting..." : "Confirm"}  {/* TEXT CHANGE */}
          </button>
          {/* <button 
            onClick={onConfirm} 
            style={{ 
              padding: "12px 32px", 
              borderRadius: 8, 
              border: "none",
              background: "#232323", 
              color: "#fff",
              fontSize: 16,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              minWidth: 100
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#000";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#232323";
            }}
          >
            Confirm
          </button> */}
        </div>
      </div>
      <style>{`
        @keyframes dialogFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Toast
export function Toast({ open, message, onClose, duration = 2500 }) {
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);
  if (!open) return null;
  return (
    <div style={{
      position: "fixed",
      bottom: 32,
      right: 32,
      background: "#232323",
      color: "#fff",
      padding: "16px 24px",
      borderRadius: 12,
      fontWeight: 600,
      fontSize: 16,
      zIndex: 9999,
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      border: "1px solid rgba(255,255,255,0.1)",
      animation: "toastSlideIn 0.3s ease-out"
    }}>
      {message}
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}