import React from "react";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Return 503 Service Unavailable status for maintenance
  res.statusCode = 503;

  // Tell search engines this is temporary
  res.setHeader("Retry-After", "3600"); // Retry after 1 hour
  res.setHeader("X-Robots-Tag", "noindex, follow"); // Don't index this page
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // Don't cache

  return {
    props: {},
  };
};

export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          maxWidth: "600px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Animated Maintenance Icon */}
        <div
          style={{
            fontSize: "64px",
            marginBottom: "1.5rem",
            animation: "pulse 2s infinite",
          }}
        >
          🔧
        </div>

        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            color: "#1a1a1a",
            margin: "0 0 1rem 0",
          }}
        >
          Scheduled Maintenance
        </h1>

        <p
          style={{
            fontSize: "1.125rem",
            color: "#555",
            lineHeight: "1.6",
            margin: "1rem 0",
          }}
        >
          We're currently performing scheduled maintenance to improve our
          service. We expect to be back online shortly.
        </p>

        <div
          style={{
            background: "#f5f5f5",
            padding: "1.5rem",
            borderRadius: "8px",
            margin: "2rem 0",
            textAlign: "left",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#1a1a1a",
              margin: "0 0 0.75rem 0",
            }}
          >
            What's happening?
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.5rem",
              color: "#666",
              lineHeight: "1.8",
            }}
          >
            <li>Database optimization in progress</li>
            <li>System enhancements being deployed</li>
            <li>Infrastructure updates underway</li>
          </ul>
        </div>

        <div
          style={{
            fontSize: "0.875rem",
            color: "#999",
            marginBottom: "2rem",
          }}
        >
          <p>We appreciate your patience.</p>
          <p>Estimated time: Less than 30 minutes</p>
        </div>

        <button
          onClick={() => location.reload()}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            padding: "0.875rem 2rem",
            fontSize: "1rem",
            fontWeight: "600",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            marginRight: "1rem",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.transform =
              "translateY(-2px)";
            (e.target as HTMLButtonElement).style.boxShadow =
              "0 10px 25px rgba(102, 126, 234, 0.4)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.transform = "translateY(0)";
            (e.target as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          Try Again
        </button>

        <a
          href="https://status.localonline.in"
          style={{
            display: "inline-block",
            color: "#667eea",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "0.95rem",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.textDecoration =
              "underline";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.textDecoration =
              "none";
          }}
        >
          Check Status
        </a>

        <div
          style={{
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid #e0e0e0",
            fontSize: "0.875rem",
            color: "#666",
          }}
        >
          <p
            style={{
              margin: "0 0 1rem 0",
              fontWeight: "600",
              color: "#1a1a1a",
            }}
          >
            Need Immediate Support?
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            <a
              href="mailto:support@localonline.in"
              style={{
                color: "#667eea",
                textDecoration: "none",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.textDecoration =
                  "underline";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.textDecoration =
                  "none";
              }}
            >
              ✉️ support@localonline.in
            </a>
            <a
              href="tel:+919268109317"
              style={{
                color: "#667eea",
                textDecoration: "none",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.textDecoration =
                  "underline";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.textDecoration =
                  "none";
              }}
            >
              📞 +91 9268109317
            </a>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(0.95);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
