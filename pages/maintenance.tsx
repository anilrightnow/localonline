import React from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const fromPath =
    typeof router.query.from === "string" ? router.query.from : "/";

  const handleTryAgain = () => {
    // Redirect to the original path the user was trying to access
    router.push(fromPath);
  };

  return (
    <div className="maintenance-shell">
      <div className="maintenance-card">
        {/* Animated Maintenance Icon */}
        <div className="maintenance-icon">🔧</div>

        <h1 className="maintenance-title">Scheduled Maintenance</h1>

        <p className="maintenance-desc">
          We're currently performing scheduled maintenance to improve our
          service. We expect to be back online shortly.
        </p>

        <div className="maintenance-info">
          <h3>What's happening?</h3>
          <ul>
            <li>Database optimization in progress</li>
            <li>System enhancements being deployed</li>
            <li>Infrastructure updates underway</li>
          </ul>
        </div>

        <div className="maintenance-footer-text">
          <p>We appreciate your patience.</p>
          <p>Estimated time: Less than 30 minutes</p>
        </div>

        <button
          onClick={handleTryAgain}
          className="maintenance-btn"
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

        <a href="https://localonline.in" className="status-link">
          Check Status
        </a>

        <div className="support-section">
          <p className="support-title">Need Immediate Support?</p>
          <div className="support-links">
            <a href="mailto:support@localonline.in" className="support-link">
              ✉️ support@localonline.in
            </a>
            <a href="tel:+919268109317" className="support-link">
              📞 +91 9268109317
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .maintenance-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .maintenance-card {
          text-align: center;
          padding: 2rem;
          max-width: 600px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .maintenance-icon {
          font-size: 64px;
          margin-bottom: 1.5rem;
          animation: pulse 2s infinite;
        }
        .maintenance-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 1rem 0;
        }
        .maintenance-desc {
          font-size: 1.125rem;
          color: #555;
          line-height: 1.6;
          margin: 1rem 0;
        }
        .maintenance-info {
          background: #f5f5f5;
          padding: 1.5rem;
          border-radius: 8px;
          margin: 2rem 0;
          text-align: left;
        }
        .maintenance-info h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 0.75rem 0;
        }
        .maintenance-info ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #666;
          line-height: 1.8;
        }
        .maintenance-footer-text {
          font-size: 0.875rem;
          color: #999;
          margin-bottom: 2rem;
        }
        .maintenance-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition:
            transform 0.2s,
            box-shadow 0.2s;
          margin-right: 1rem;
        }
        .status-link {
          display: inline-block;
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .status-link:hover {
          text-decoration: underline;
        }
        .support-section {
          margintop: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e0e0e0;
          font-size: 0.875rem;
          color: #666;
        }
        .support-title {
          margin: 0 0 1rem 0;
          font-weight: 600;
          color: #1a1a1a;
        }
        .support-links {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .support-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .support-link:hover {
          text-decoration: underline;
        }
        @keyframes pulse {
          0%,
          100% {
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
  );
}
