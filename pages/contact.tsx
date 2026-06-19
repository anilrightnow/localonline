import Head from "next/head";
import { useState } from "react";
import axios from "axios";
import SiteShell from "../components/public/SiteShell";
import SectionCard from "../components/public/SectionCard";
import FormMessage from "../components/shared/FormMessage";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { getApiBaseUrl } from "../lib/publicApi";
import { getApiErrorMessage } from "../lib/apiError";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await axios.post(`${apiBaseUrl}/api/contact`, {
        name,
        email,
        subject,
        message,
      });
      setStatus({
        message: response.data.message || "Message sent!",
        tone: "success",
      });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setStatus({
        message: getApiErrorMessage(err, "Failed to send message."),
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us | LocalOnline</title>
        <meta
          name="description"
          content="Get in touch with LocalOnline support for any inquiries or assistance."
        />
      </Head>
      <SiteShell>
        <section className="pub-hero">
          <h1 className="pub-title">Contact Us</h1>
          <p className="pub-subtitle">
            Have questions? We're here to help. Reach out to us using the form
            below or via our contact details.
          </p>
        </section>

        <div className="app-grid">
          <SectionCard title="Send us a message">
            {status && (
              <FormMessage message={status.message} tone={status.tone} />
            )}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label htmlFor="subject">Subject</label>
                <input
                  id="subject"
                  className="form-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label htmlFor="message">How can we help?</label>
                <textarea
                  id="message"
                  className="form-input"
                  style={{ minHeight: "150px" }}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <div className="app-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Direct Support">
            <div
              // Removed inline style and added class for styling
              className="direct-support-grid"
            >
              <div>
                <p
                  className="pub-muted"
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Mail size={24} className="contact-icon" />
                  <a
                    href="mailto:support@localonline.in"
                    className="support-email-link"
                  >
                    support@localonline.in
                  </a>
                </p>
              </div>
              <div>
                <p
                  className="pub-muted"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "1.1rem",
                  }}
                >
                  <Phone size={24} className="contact-icon" />
                  <a href="tel:+919268109317" className="support-phone-link">
                    +91 9268109317
                  </a>
                </p>
              </div>
              <div>
                <p
                  className="pub-muted"
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <a
                    href="https://wa.me/919268109317"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat on WhatsApp"
                    className="whatsapp-contact-link"
                  >
                    <MessageCircle size={28} />
                    <span style={{ marginLeft: "8px" }}>Chat on WhatsApp</span>
                  </a>
                </p>
              </div>
              <div>
                <h3 style={{ marginTop: 0 }}>Support Hours</h3>
                <p className="pub-muted">
                  Monday - Saturday: 10:00 AM - 7:00 PM IST
                </p>
                <p className="pub-muted">Sunday: Closed</p>
              </div>
            </div>
          </SectionCard>
        </div>
        <style jsx>{`
          .direct-support-grid {
            display: grid;
            gap: 20px;
          }
          .support-email-link,
          .support-phone-link {
            color: var(--marigold);
            font-weight: 600;
          }
          .whatsapp-contact-link {
            display: inline-flex;
            align-items: center;
            color: #25d366;
            font-weight: 600;
            font-size: 1.1rem;
            transition: transform 0.2s;
          }
          .whatsapp-contact-link:hover {
            transform: scale(1.05);
          }
          .contact-icon {
            color: var(--marigold);
          }
        `}</style>
      </SiteShell>
    </>
  );
}
