import { useState, FormEvent, useMemo } from "react";
import AppShell from "../../components/app/AppShell";
import { useRequireAuth } from "../../lib/auth";
import { getApiBaseUrl } from "../../lib/publicApi";
import axios from "axios";
import FormMessage from "../../components/shared/FormMessage";
import { getAuthToken } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/apiError";
//import { hasRole } from "../../lib/session";

export default function ImportSqlPage() {
  const { isChecking, isAuthenticated } = useRequireAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  //const isSuperAdmin = useMemo(() => hasRole(session, "SuperAdmin"), [session]);

  if (isChecking || !isAuthenticated) {
    return <div className="app-loading">Redirecting to login...</div>;
  }

  //   if (!isSuperAdmin) {
  //     return (
  //       <AppShell
  //         title="Access Denied"
  //         subtitle="You do not have permission to view this page."
  //       >
  //         <p>Please contact an administrator if you believe this is an error.</p>
  //       </AppShell>
  //     );
  //   }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setMessage(null);
      setError(null);
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
      setSelectedFile(null); // Clear selected file after successful upload
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
              {isUploading ? "Uploading..." : "Import SQL"}
            </button>
          </div>
        </form>
      </div>
      <p className="pub-muted">
        Note: Uploaded SQL files are processed and then deleted from the server.
        The import process will check for existing data and only insert new
        records.
      </p>
    </AppShell>
  );
}
