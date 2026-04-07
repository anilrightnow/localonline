import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { getAuthToken, useRequireAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { apiUrl } from "../../lib/apiClient";
import AppShell from "../../components/app/AppShell";
import { getUserSessionFromToken, hasRole } from "../../lib/session";
import FormMessage from "../../components/shared/FormMessage";

type SocietyRow = {
  id: string;
  name: string;
  description: string;
  citySlug: string;
  areaSlug?: string | null;
  contactEmail?: string | null;
};

type CityOption = {
  id: number;
  name: string;
  slug: string;
};

type AreaOption = {
  id: number;
  name: string;
  slug: string;
};

export default function SocietiesPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const session = getUserSessionFromToken(getAuthToken());
  const canCreateSociety = hasRole(session, "Admin");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [areaSlug, setAreaSlug] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [areaQuery, setAreaQuery] = useState("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [areaOptions, setAreaOptions] = useState<AreaOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaOption | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [societies, setSocieties] = useState<SocietyRow[]>([]);
  const [mySocieties, setMySocieties] = useState<Array<{ id: string; name: string; status: string; citySlug: string }>>([]);

  async function loadSocieties() {
    try {
      const response = await axios.get(apiUrl("/api/community/societies"));
      setSocieties(response.data ?? []);
    } catch {
      setSocieties([]);
    }
  }

  useEffect(() => {
    loadSocieties();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const term = cityQuery.trim();
    if (term.length < 2) {
      setCityOptions([]);
      return;
    }
    const token = getAuthToken();
    axios
      .get(apiUrl("/api/master/cities"), {
        params: { q: term, limit: 15 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setCityOptions(res.data ?? []))
      .catch(() => setCityOptions([]));
  }, [cityQuery, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!selectedCity) {
      setAreaOptions([]);
      return;
    }
    const term = areaQuery.trim();
    if (term.length < 2) {
      setAreaOptions([]);
      return;
    }
    const token = getAuthToken();
    axios
      .get(apiUrl("/api/master/areas"), {
        params: { q: term, limit: 15, cityId: selectedCity.id },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setAreaOptions(res.data ?? []))
      .catch(() => setAreaOptions([]));
  }, [areaQuery, isAuthenticated, selectedCity]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!canCreateSociety) {
      setMessage("Only Admin and SuperAdmin can create societies.");
      return;
    }
    try {
      const token = getAuthToken();
      const response = await axios.post(
        apiUrl("/api/community/societies"),
        {
          name,
          description,
          citySlug,
          areaSlug: areaSlug || null,
          contactEmail: contactEmail || null,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setMessage(response.data?.message ?? "Submitted.");
      await loadMine();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Submit failed."));
    }
  }

  async function loadMine() {
    try {
    const token = getAuthToken();
      const response = await axios.get(apiUrl("/api/community/mine"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMySocieties(response.data?.societies ?? []);
    } catch {
      setMySocieties([]);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void loadMine();
    }
  }, [isAuthenticated]);

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  return (
    <AppShell title="Community Societies" subtitle="Submit local society listings and monitor publication.">
      {message ? <FormMessage message={message} tone="success" /> : null}
      <div className="app-card">
        {!canCreateSociety ? <p>Only Admin and SuperAdmin can create societies.</p> : null}
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Name</label>
            <input className="form-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea className="form-textarea" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="form-row">
            <label>City</label>
            <input
              className="form-input"
              placeholder="Type city name"
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setSelectedCity(null);
                setCitySlug("");
                setSelectedArea(null);
                setAreaSlug("");
                setAreaQuery("");
                setAreaOptions([]);
              }}
              required
            />
            {selectedCity ? (
              <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center" }}>
                <span>Selected: <strong>{selectedCity.name}</strong> ({selectedCity.slug})</span>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    setSelectedCity(null);
                    setCitySlug("");
                    setCityQuery("");
                    setSelectedArea(null);
                    setAreaSlug("");
                    setAreaQuery("");
                    setAreaOptions([]);
                  }}
                >
                  Clear
                </button>
              </div>
            ) : null}
            {cityOptions.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {cityOptions.map((option) => (
                  <button
                    key={option.id}
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => {
                      setSelectedCity(option);
                      setCitySlug(option.slug);
                      setCityQuery(option.name);
                      setCityOptions([]);
                      setSelectedArea(null);
                      setAreaSlug("");
                      setAreaQuery("");
                      setAreaOptions([]);
                    }}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="form-row">
            <label>Area (optional)</label>
            <input
              className="form-input"
              placeholder={selectedCity ? "Type area name" : "Select a city first"}
              value={areaQuery}
              onChange={(e) => {
                setAreaQuery(e.target.value);
                setSelectedArea(null);
                setAreaSlug("");
              }}
              disabled={!selectedCity}
            />
            {selectedArea ? (
              <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center" }}>
                <span>Selected: <strong>{selectedArea.name}</strong> ({selectedArea.slug})</span>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    setSelectedArea(null);
                    setAreaSlug("");
                    setAreaQuery("");
                  }}
                >
                  Clear
                </button>
              </div>
            ) : null}
            {areaOptions.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {areaOptions.map((option) => (
                  <button
                    key={option.id}
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => {
                      setSelectedArea(option);
                      setAreaSlug(option.slug);
                      setAreaQuery(option.name);
                      setAreaOptions([]);
                    }}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="form-row">
            <label>Contact Email (optional)</label>
            <input className="form-input" placeholder="Contact Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={!canCreateSociety || !citySlug}>Submit Society</button>
          <button className="btn btn-ghost" type="button" onClick={loadSocieties} style={{ marginLeft: 10 }}>Refresh</button>
        </form>
      </div>
      <div className="app-grid">
        <div className="app-card">
          <h2>My Society Submissions</h2>
          {mySocieties.length === 0 ? <p>No society submissions yet.</p> : null}
          <ul>
            {mySocieties.map((item) => (
              <li key={item.id}>{item.name} ({item.citySlug}) - {item.status}</li>
            ))}
          </ul>
        </div>
        <div className="app-card">
          <h2>Published Societies</h2>
          <ul>
            {societies.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> ({item.citySlug}) {item.contactEmail ? `- ${item.contactEmail}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
