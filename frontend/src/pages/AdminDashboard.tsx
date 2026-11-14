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

export default function AdminDashboard() {
  const { t, language, setLanguage } = useLanguage();
  const [pending, setPending] = useState<MineralListing[]>([]);
  const [approved, setApproved] = useState<MineralListing[]>([]);
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

  useEffect(() => {
    void loadPending();
    void loadApproved();
  }, [loadPending, loadApproved]);

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
    background: "#ffffff",
    border: "1px solid #e4e8e1",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  };

  const button: React.CSSProperties = {
    border: 0,
    borderRadius: 7,
    padding: "11px 17px",
    color: "#fff",
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
              style={{ ...button, background: "#176b43" }}
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
      color: "#202020",
    }}>
      <header style={{
        background: "#17231e",
        color: "#fff",
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
        <p role="status" style={{ ...card, color: "#176b43" }}>
          {message}
        </p>
      )}

      <section style={card}>
        <h2>{t("pending")}: {pending.length}</h2>
        <button
          type="button"
          style={{ ...button, background: "#176b43" }}
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
        <h2>{t("approved")}: {approved.length}</h2>
        <button
          type="button"
          style={{ ...button, background: "#176b43" }}
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
