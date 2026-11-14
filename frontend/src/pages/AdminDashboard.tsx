import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { axiosClient } from "../lib/axiosClient";
import { languageOptions, useLanguage } from "../contexts/LanguageContext";

interface MineralListing {
  _id: string;
  mineralType: string;
  description: string;
  location: string;
  weight: number;
  weightUnit: string;
  price: number;
  currency: string;
  contact: string;
  imageUrls?: string[];
  sellerUsername?: string;
  createdAt?: string;
}

interface InspectionRequest {
  _id: string;
  buyerUsername?: string;
  sellerUsername?: string;
  mineralType?: string;
  listingLocation?: string;
  reason: string;
  status: "requested" | "reviewing" | "declined" | string;
  createdAt?: string;
}

export default function AdminDashboard() {
  const { t, language, setLanguage } = useLanguage();
  const [pending, setPending] = useState<MineralListing[]>([]);
  const [approved, setApproved] = useState<MineralListing[]>([]);
  const [inspectionRequests, setInspectionRequests] = useState<InspectionRequest[]>([]);
  const [loadingInspections, setLoadingInspections] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.get("/mineral-listings/pending");
      setPending(
        Array.isArray(response.data?.listings)
          ? response.data.listings
          : []
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.status === 403
          ? t("adminOnly")
          : err?.response?.status === 401
          ? t("piLoginRequired")
          : t("pendingLoadFailed")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadApproved = useCallback(async () => {
    setLoadingApproved(true);

    try {
      const response = await axiosClient.get("/mineral-listings/approved");
      setApproved(
        Array.isArray(response.data?.listings)
          ? response.data.listings
          : []
      );
    } catch (err) {
      console.error(err);
      setError(t("approvedLoadFailed"));
    } finally {
      setLoadingApproved(false);
    }
  }, [t]);

  const loadInspectionRequests = useCallback(async () => {
    setLoadingInspections(true);
    try {
      const response = await axiosClient.get("/mineral-listings/inspection-requests");
      setInspectionRequests(
        Array.isArray(response.data?.requests) ? response.data.requests : []
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.status === 403
          ? t("adminOnly")
          : err?.response?.status === 401
          ? t("piLoginRequired")
          : t("inspectionLoadFailed")
      );
    } finally {
      setLoadingInspections(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPending();
    void loadApproved();
    void loadInspectionRequests();
  }, [loadPending, loadApproved, loadInspectionRequests]);

  const reviewListing = async (
    listing: MineralListing,
    status: "approved" | "rejected"
  ) => {
    if (!window.confirm(
      status === "approved" ? t("approveConfirm") : t("rejectConfirm")
    )) return;

    setBusyId(listing._id);
    setError("");
    setMessage("");

    try {
      await axiosClient.patch(
        `/mineral-listings/${listing._id}/moderation`,
        { status }
      );

      setPending((current) =>
        current.filter((item) => item._id !== listing._id)
      );

      if (status === "approved") {
        await loadApproved();
      }

      setMessage(
        status === "approved"
          ? t("approvedMessage")
          : t("rejectedMessage")
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.status === 403
          ? t("adminOnly")
          : t("decisionFailed")
      );
    } finally {
      setBusyId("");
    }
  };

  const updateInspectionStatus = async (
    request: InspectionRequest,
    status: "reviewing" | "declined"
  ) => {
    if (!window.confirm(status === "reviewing" ? t("inspectionReviewConfirm") : t("inspectionDeclineConfirm"))) return;
    setBusyId(request._id);
    setError("");
    setMessage("");
    try {
      await axiosClient.patch(
        `/mineral-listings/inspection-requests/${request._id}/status`,
        { status }
      );
      await loadInspectionRequests();
      setMessage(status === "reviewing" ? t("inspectionReviewSaved") : t("inspectionDeclineSaved"));
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.status === 403 ? t("adminOnly") : t("inspectionUpdateFailed"));
    } finally {
      setBusyId("");
    }
  };

  const deleteListing = async (listing: MineralListing) => {
    const confirmed = window.confirm(
      t("deleteConfirm")
    );

    if (!confirmed) return;

    setBusyId(listing._id);
    setError("");
    setMessage("");

    try {
      await axiosClient.delete(`/mineral-listings/${listing._id}`);

      setApproved((current) =>
        current.filter((item) => item._id !== listing._id)
      );

      setMessage(t("deletedMessage"));
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.status === 403
          ? t("adminOnly")
          : err?.response?.status === 404
          ? t("deleteFailed")
          : t("deleteFailed")
      );
    } finally {
      setBusyId("");
    }
  };

  const card: React.CSSProperties = {
    background: "#fff8dc",
    border: "1px solid #d9a514",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  };

  const button: React.CSSProperties = {
    border: 0,
    borderRadius: 7,
    padding: "11px 17px",
    color: "#17233e",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const renderListing = (
    listing: MineralListing,
    approvedListing: boolean
  ) => (
    <article key={listing._id} style={card}>
      <h2>{listing.mineralType}</h2>

      {listing.imageUrls?.map((url, index) => (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          key={url + index}
        >
          <img
            src={url}
            alt={`Picha ya ${listing.mineralType}`}
            loading="lazy"
            style={{
              width: 130,
              height: 110,
              objectFit: "cover",
              borderRadius: 8,
              margin: 5,
            }}
          />
        </a>
      ))}

      <p>{listing.description}</p>
      <p><strong>{t("location")}:</strong> {listing.location}</p>
      <p><strong>{t("weight")}:</strong> {listing.weight} {listing.weightUnit}</p>
      <p>
        <strong>{t("price")}:</strong>{" "}
        {Number(listing.price).toLocaleString()} {listing.currency}
      </p>
      <p><strong>{t("contact")}:</strong> {listing.contact}</p>
      <p>
        <strong>{t("seller")}:</strong>{" "}
        @{listing.sellerUsername || t("noSellerName")}
      </p>

      <div style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginTop: 16,
      }}>
        {approvedListing ? (
          <button
            type="button"
            style={{ ...button, background: "#9b2929" }}
            onClick={() => void deleteListing(listing)}
            disabled={busyId === listing._id}
          >
            {busyId === listing._id ? t("deleting") : t("delete")}
          </button>
        ) : (
          <>
            <button
              type="button"
              style={{ ...button, background: "#e8b923" }}
              onClick={() => void reviewListing(listing, "approved")}
              disabled={busyId === listing._id}
            >
              {busyId === listing._id ? t("approving") : t("approve")}
            </button>

            <button
              type="button"
              style={{ ...button, background: "#9b2929" }}
              onClick={() => void reviewListing(listing, "rejected")}
              disabled={busyId === listing._id}
            >
              {busyId === listing._id ? t("approving") : t("reject")}
            </button>
          </>
        )}
      </div>
    </article>
  );

  return (
    <main style={{
      maxWidth: 1100,
      margin: "0 auto",
      padding: 20,
      fontFamily: "Arial, sans-serif",
      color: "#17233e",
      background: "#fff1b8",
    }}>
      <header style={{
        background: "linear-gradient(135deg, #ffe680 0%, #e0aa12 55%, #c58a00 100%)",
        color: "#17233e",
        padding: 22,
        borderRadius: 12,
        marginBottom: 20,
      }}>
        <h1>GFAMOUS {t("admin")}</h1>
        <p>{t("moderation")}</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/" style={{ color: "#fff" }}>
            {t("backToMarket")}
          </Link>
          <label htmlFor="admin-language">{t("language")}</label>
          <select
            id="admin-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as typeof language)}
            style={{ padding: 8, borderRadius: 6 }}
          >
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.label}</option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <p role="alert" style={{ ...card, color: "#a00000" }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ ...card, color: "#8a6500" }}>
          {message}
        </p>
      )}

      <section style={card}>
        <h2>{t("pending")}: {pending.length}</h2>
        <button
          type="button"
          style={{ ...button, background: "#f2c230" }}
          onClick={() => void loadPending()}
          disabled={loading}
        >
          {loading ? t("loading") : t("refresh")}
        </button>
      </section>

      {loading && <p>{t("loading")}</p>}

      {!loading && pending.length === 0 && (
        <section style={card}>
          {t("noPending")}
        </section>
      )}

      {pending.map((listing) => renderListing(listing, false))}

      <section style={card}>
        <h2>{t("inspectionRequests")}: {inspectionRequests.length}</h2>
        <button
          type="button"
          style={{ ...button, background: "#10213b" }}
          onClick={() => void loadInspectionRequests()}
          disabled={loadingInspections}
        >
          {loadingInspections ? t("loading") : t("refresh")}
        </button>
        <p>{t("inspectionNotice")}</p>
      </section>

      {loadingInspections && <p>{t("loading")}</p>}
      {!loadingInspections && inspectionRequests.length === 0 && (
        <section style={card}>{t("noInspectionRequests")}</section>
      )}
      {inspectionRequests.map((request) => (
        <article key={request._id} style={card}>
          <h3>{request.mineralType || t("unknownMineral")}</h3>
          <p><strong>{t("buyer")}:</strong> @{request.buyerUsername || t("noSellerName")}</p>
          <p><strong>{t("seller")}:</strong> @{request.sellerUsername || t("noSellerName")}</p>
          <p><strong>{t("location")}:</strong> {request.listingLocation || "—"}</p>
          <p><strong>{t("inspectionReason")}:</strong> {request.reason}</p>
          <p><strong>{t("inspectionStatus")}:</strong> {t(request.status === "requested" ? "inspectionRequested" : request.status === "reviewing" ? "inspectionReviewing" : "inspectionDeclined")}</p>
          <p><strong>{t("requestDate")}:</strong> {request.createdAt ? new Date(request.createdAt).toLocaleString() : "—"}</p>
          {request.status !== "declined" && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              {request.status !== "reviewing" && (
                <button type="button" style={{ ...button, background: "#10213b" }} onClick={() => void updateInspectionStatus(request, "reviewing")} disabled={busyId === request._id}>
                  {t("markReviewing")}
                </button>
              )}
              <button type="button" style={{ ...button, background: "#9b2929" }} onClick={() => void updateInspectionStatus(request, "declined")} disabled={busyId === request._id}>
                {t("declineRequest")}
              </button>
            </div>
          )}
        </article>
      ))}

      <section style={card}>
        <h2>{t("approved")}: {approved.length}</h2>
        <button
          type="button"
          style={{ ...button, background: "#10213b" }}
          onClick={() => void loadApproved()}
          disabled={loadingApproved}
        >
          {loadingApproved ? t("loading") : t("refresh")}
        </button>
      </section>

      {loadingApproved && <p>{t("loading")}</p>}

      {!loadingApproved && approved.length === 0 && (
        <section style={card}>
          {t("noApproved")}
        </section>
      )}

      {approved.map((listing) => renderListing(listing, true))}
    </main>
  );
}
