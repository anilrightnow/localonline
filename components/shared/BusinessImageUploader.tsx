import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../lib/apiClient";
import { getAuthToken } from "../../lib/auth";
import { AlertCircle, CheckCircle2, Trash2, Upload, X } from "lucide-react";

export type MediaItem = {
  LargeUrl: string;
  PublicId?: string;
  publicId?: string;
};

type Props = {
  businessToken: string;
  planName?: string;
  imageLimit: number;
  canEdit: boolean;
  isAdmin: boolean;
  initialMedia: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
};

export default function BusinessImageUploader({
  businessToken,
  planName = "Free",
  imageLimit,
  canEdit,
  isAdmin,
  initialMedia,
  onMediaChange,
}: Props) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState("");
  const onMediaChangeRef = useRef(onMediaChange);

  const isAtLimit = media.length >= imageLimit;
  const initialMediaRef = useRef(initialMedia);
  const mediaRef = useRef(media);

  useEffect(() => {
    onMediaChangeRef.current = onMediaChange;
  }, [onMediaChange]);

  function normalize(items: MediaItem[]): MediaItem[] {
    if (!items.length) return [];
    return items.map((item) => ({
      ...item,
      PublicId: item.PublicId || item.publicId,
    }));
  }

  function hasPublicId(items: MediaItem[]): boolean {
    return items.some((item) => !!(item.PublicId || item.publicId));
  }

  useEffect(() => {
    const normalized = normalize(initialMedia);
    setMedia(normalized);
    if (normalized.length) {
      onMediaChange(normalized);
    }
    initialMediaRef.current = initialMedia;
  }, [initialMedia]);

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError("");
      setLoading(true);
      try {
        const token = getAuthToken();
        const res = await axios.get(
          apiUrl(`/api/business-images/${encodeURIComponent(businessToken)}`),
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (cancelled) return;

        const raw = Array.isArray(res.data?.mediaJson)
          ? res.data.mediaJson
          : [];
        const items = raw.map((m: any) => ({
          PublicId: m.PublicId || m.publicId,
          LargeUrl: m.LargeUrl || "",
        }));
        const normalized = normalize(items);
        setMedia(normalized);
        if (normalized.length) {
          onMediaChangeRef.current(normalized);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Failed to load business images.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessToken]);

  useEffect(() => {
    if (!isAdmin) {
      void loadPendingCount();
    }
  }, [businessToken, isAdmin]);

  async function loadPendingCount() {
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      params.set("status", "Pending");
      if (businessToken) {
        const businessId = decodeBusinessId(businessToken);
        if (businessId) params.set("q", String(businessId));
      }
      const res = await axios.get(
        apiUrl(`/api/admin/listing-updates?${params.toString()}`),
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setPendingCount(res.data?.pagination?.totalCount || 0);
    } catch {
      setPendingCount(0);
    }
  }

  async function handleUpload() {
    if (!selectedFiles.length) return;
    if (!canEdit) {
      setMessage("Gallery edits require a higher plan.");
      return;
    }
    if (isAtLimit) {
      setMessage(`Image limit reached (${imageLimit}).`);
      return;
    }

    setUploading(true);
    setMessage("");
    let resultMessage = "";
    try {
      const token = getAuthToken();
      const uploadResults: MediaItem[] = [];

      for (const file of selectedFiles) {
        const form = new FormData();
        form.append("businessToken", businessToken);
        const compressed = await compressImageFile(file);
        form.append("images", compressed, compressed.name);

        const res = await axios.post<{
          pending?: boolean;
          message?: string;
          uploaded?: Array<{ publicId?: string; PublicId?: string; LargeUrl?: string }>;
        }>(
          apiUrl("/api/business-images/upload"),
          form,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        const data = res.data;
        if (data.pending) {
          resultMessage =
            data.message ||
            `${data.uploaded?.length || 0} image(s) submitted for admin review.`;
          continue;
        }

        const uploaded = data.uploaded || [];
        for (const item of uploaded) {
          uploadResults.push({
            PublicId: item.PublicId || item.publicId,
            LargeUrl: item.LargeUrl || "",
          });
        }
      }

      if (uploadResults.length > 0) {
        const next = normalize([...mediaRef.current, ...uploadResults]);
        setMedia(next);
        onMediaChange(next);
        resultMessage = `${uploadResults.length} image(s) uploaded.`;
      } else if (!resultMessage) {
        resultMessage = "Upload complete.";
      }
      setSelectedFiles([]);
      setPreviews([]);
      setMessage(resultMessage);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || "Upload failed.";
      setMessage(errMsg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(publicId: string) {
    if (!publicId) return;
    if (!confirm("Delete this image? This will be removed permanently.")) return;

    setMessage("");
    try {
      const token = getAuthToken();
      const res = await axios.post<{ pending?: boolean; message?: string }>(
        apiUrl("/api/business-images/delete"),
        { businessToken, publicId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      const remaining = mediaRef.current.filter(
        (item) => (item.PublicId || item.publicId) !== publicId
      );
      const next = normalize(remaining);
      setMedia(next);
      onMediaChange(next);
      setMessage(
        res.data.message ||
          (res.data.pending ? "Submitted for admin review." : "Image deleted.")
      );
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Delete failed.");
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = Math.max(0, imageLimit - media.length - selectedFiles.length);
    const toAdd = files.slice(0, remaining);
    setSelectedFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const remaining = Math.max(0, imageLimit - media.length - selectedFiles.length);
    const toAdd = files.slice(0, remaining);
    setSelectedFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  }

  const currentMedia = normalize(media);
  const effectiveMedia = currentMedia.length ? currentMedia : normalize(initialMedia);

  return (
    <div className="app-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 4 }}>Gallery</h3>
          <p className="pub-muted">
            {planName} plan limit: {effectiveMedia.length} / {imageLimit} images
          </p>
        </div>
        {pendingCount > 0 && !isAdmin && (
          <span className="pub-muted">
            {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {pendingCount > 0 && !isAdmin && (
        <div className="form-alert is-warning" style={{ marginBottom: 12 }}>
          <AlertCircle size={18} />
          <span>
            You have pending update requests. Uploaded images will be reviewed by admin before going live.
          </span>
        </div>
      )}

      {loading && (
        <p style={{ marginBottom: 12, color: "#8898aa" }}>Loading images...</p>
      )}

      {loadError && (
        <div className="form-alert is-error" style={{ marginBottom: 12 }}>
          <AlertCircle size={18} />
          <span>{loadError}</span>
        </div>
      )}

      {message && (
        <div className={`form-alert ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("error") ? "is-error" : "is-success"}`} style={{ marginBottom: 12 }}>
          {message.toLowerCase().includes("failed") || message.toLowerCase().includes("error") ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message}</span>
        </div>
      )}

      {effectiveMedia.length === 0 || !hasPublicId(effectiveMedia) ? (
        <p className="pub-muted">No images uploaded yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {effectiveMedia.map((item, idx) => {
            const publicId = item.PublicId || item.publicId;
            return (
              <div
                key={`${publicId}-${idx}`}
                style={{
                  position: "relative",
                  border: "1px solid #d9e2ec",
                  borderRadius: 8,
                  overflow: "hidden",
                  backgroundColor: "#fff",
                }}
              >
                <img
                  src={item.LargeUrl}
                  alt={`Business image ${idx + 1}`}
                  onError={() => {
                    setBrokenImages((prev) => {
                      const next = new Set(prev);
                      next.add(item.LargeUrl);
                      return next;
                    });
                  }}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    display: "block",
                    backgroundColor: brokenImages.has(item.LargeUrl) ? "#e9ecef" : undefined,
                  }}
                />
                {brokenImages.has(item.LargeUrl) && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8898aa",
                      fontSize: 12,
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    Image unavailable
                  </div>
                )}
                {canEdit && publicId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(publicId)}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: 4,
                      cursor: "pointer",
                    }}
                    title="Delete image"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: dragOver ? "2px dashed #1570ef" : "2px dashed #c7d0d8",
            borderRadius: 10,
            padding: 16,
            textAlign: "center",
            background: dragOver ? "#e9f2ff" : "#f8f9fa",
            transition: "all 0.15s ease",
          }}
        >
          <input
            id="business-image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            style={{ display: "none" }}
          />
          <label htmlFor="business-image-upload" style={{ cursor: "pointer" }}>
            <Upload size={18} style={{ marginBottom: 6 }} />
            <div>
              <strong>Click or drag images here to upload</strong>
              <p className="pub-muted">
                Max {imageLimit} total. Remaining: {Math.max(0, imageLimit - effectiveMedia.length - selectedFiles.length)}.
              </p>
            </div>
          </label>

          {previews.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {previews.map((src, idx) => (
                <div key={idx} style={{ position: "relative", width: 80, height: 80 }}>
                  <img src={src} alt={`Preview ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                      setPreviews((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      background: "#555",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      cursor: "pointer",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="btn btn-primary"
                style={{ marginLeft: 8 }}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          )}
        </div>
      )}

      {!canEdit && hasPublicId(effectiveMedia) && (
        <p className="pub-muted">Gallery edits require the Popular plan or admin access.</p>
      )}
    </div>
  );
}

function decodeBusinessId(token: string): number | null {
  if (!token) return null;
  if (token.startsWith("b") && token.length > 10) {
    return Number(token.substring(1));
  }
  return Number(token);
}

async function compressImageFile(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82)
    );
    if (!blob) return file;
    const name = file.name.replace(/\.(png|jpe?g)$/i, ".webp");
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}
