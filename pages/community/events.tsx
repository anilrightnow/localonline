import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { useRequireAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { getAuthToken } from "../../lib/auth";
import { apiUrl, apiFetch } from "../../lib/apiClient";
import { getUserSessionFromToken } from "../../lib/session";
import AppShell from "../../components/app/AppShell";
import FormMessage from "../../components/shared/FormMessage";
import { Mail } from "lucide-react";

type EventRow = {
  id: string;
  title: string;
  description: string;
  citySlug: string;
  areaSlug?: string | null;
  startsAt: string;
  endsAt: string;
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

export default function CommunityEventsPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [areaSlug, setAreaSlug] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [areaQuery, setAreaQuery] = useState("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [areaOptions, setAreaOptions] = useState<AreaOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaOption | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [message, setMessage] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [myEvents, setMyEvents] = useState<Array<{ id: string; title: string; status: string; citySlug: string }>>([]);
  const [currentPlan, setCurrentPlan] = useState("Free");

  async function loadEvents() {
    try {
      const response = await axios.get(apiUrl("/api/community/events"));
      setEvents(response.data ?? []);
    } catch {
      setEvents([]);
    }
  }

  useEffect(() => {
    loadEvents();
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

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = getAuthToken();
    axios
      .get(apiUrl("/api/subscriptions"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setCurrentPlan(res.data?.planName ?? "Free"))
      .catch(() => setCurrentPlan("Free"));
  }, [isAuthenticated]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const token = getAuthToken();
      const response = await axios.post(
        apiUrl("/api/community/events"),
        {
          title,
          description,
          citySlug,
          areaSlug: areaSlug || null,
          startsAt,
          endsAt,
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
      setMyEvents(response.data?.events ?? []);
    } catch {
      setMyEvents([]);
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
    <AppShell title="Community Events" subtitle="Submit local events and track your publishing status.">
      {message ? <FormMessage message={message} tone="success" /> : null}
      <div className="app-card">
        <p><strong>Current Plan:</strong> {currentPlan}</p>
        {currentPlan.toLowerCase() === "free" ? (
          <p>Events are a paid feature. Upgrade your plan to create and manage events.</p>
        ) : null}
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Title</label>
            <input className="form-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
            <label>Start</label>
            <input className="form-input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>End</label>
            <input className="form-input" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={currentPlan.toLowerCase() === "free" || !citySlug}>Submit Event</button>
          <button className="btn btn-ghost" type="button" onClick={loadEvents} style={{ marginLeft: 10 }}>Refresh</button>
        </form>
      </div>
      <div className="app-grid">
        <div className="app-card">
          <h2>My Event Submissions</h2>
          {myEvents.length === 0 ? <p>No event submissions yet.</p> : null}
          <ul>
            {myEvents.map((item) => (
              <li key={item.id}>{item.title} ({item.citySlug}) - {item.status}</li>
            ))}
          </ul>
        </div>
        <div className="app-card">
          <h2>Published Events</h2>
          <ul>
            {events.map((item) => (
              <li key={item.id}><strong>{item.title}</strong> ({item.citySlug}) - {new Date(item.startsAt).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
