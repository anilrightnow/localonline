import { useState, FormEvent, useMemo } from "react";
import AppShell from "../../components/app/AppShell";
import { useRequireAuth } from "../../lib/auth";
import { getApiBaseUrl } from "../../lib/publicApi";
import axios from "axios";
import FormMessage from "../../components/shared/FormMessage";
import { getAuthToken } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";

type Summary = {
  businesses: { total: number; inserted: number; skipped: number; errors: string[] };
  areas: { total: number; inserted: number; skipped: number; errors: string[] };
  categories: { total: number; inserted: number; skipped: number; errors: string[] };
};

export default function ImportSqlPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setMessage(null);
      setError(null);
      setSummary(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please select an SQL file to upload.");
      return;
    }

    if (
      selectedFile.type !== "application/sql" &&
      !selectedFile.name.endsWith(".sql")
    ) {
      setError("Please upload a valid SQL file (.sql extension).");
      return;
    }

    setIsUploading(true);
    setMessage(null);
    setError(null);
    setSummary(null);

    const formData = new FormData();
    formData.append("sqlFile", selectedFile);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = getAuthToken();

      const response = await axios.post(
        `${apiBaseUrl}/api/admin/import-sql`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      setMessage(response.data.message || "SQL file imported successfully.");
      if (response.data.summary) {
        setSummary(response.data.summary);
      }
      setSelectedFile(null);
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to import SQL file."));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppShell
      title="Import SQL Data"
      subtitle="Upload an SQL file to import data into the database."
    >
      <div className="app-card">
        <h2>Upload SQL File</h2>
        {message && <FormMessage message={message} tone="success" />}
        {error && <FormMessage message={error} tone="error" />}
        <form onSubmit={handleUpload}>
          <div className="form-row">
            <label htmlFor="sql-file-upload">Select SQL File</label>
            <input
              id="sql-file-upload"
              type="file"
              accept=".sql"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          {selectedFile && (
            <p className="pub-muted">Selected file: {selectedFile.name}</p>
          )}
          <div className="app-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Importing..." : "Import SQL"}
            </button>
          </div>
        </form>
      </div>

      {summary && (
        <div className="app-card">
          <h3>Import Summary</h3>
          <table className="app-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Total</th>
                <th>Inserted</th>
                <th>Skipped</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Businesses</td>
                <td>{summary.businesses.total}</td>
                <td>{summary.businesses.inserted}</td>
                <td>{summary.businesses.skipped}</td>
                <td>{summary.businesses.errors.length > 0 ? summary.businesses.errors.join(', ') : 'None'}</td>
              </tr>
              <tr>
                <td>Areas</td>
                <td>{summary.areas.total}</td>
                <td>{summary.areas.inserted}</td>
                <td>{summary.areas.skipped}</td>
                <td>{summary.areas.errors.length > 0 ? summary.areas.errors.join(', ') : 'None'}</td>
              </tr>
              <tr>
                <td>Categories</td>
                <td>{summary.categories.total}</td>
                <td>{summary.categories.inserted}</td>
                <td>{summary.categories.skipped}</td>
                <td>{summary.categories.errors.length > 0 ? summary.categories.errors.join(', ') : 'None'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p className="pub-muted">
        Note: Uploaded SQL files are processed and then deleted from the server.
        The import process checks for existing data by CID and only inserts new
        records.
      </p>
    </AppShell>
  );
}
