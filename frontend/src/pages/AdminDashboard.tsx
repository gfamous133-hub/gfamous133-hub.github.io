
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { axiosClient } from "../lib/axiosClient";

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
          ? "Huna ruhusa. Admin pekee ndiye anayeruhusiwa."
          : err?.response?.status === 401
          ? "Tafadhali ingia kwa akaunti yako ya Pi."
          : "Imeshindikana kupakia matangazo yanayosubiri."
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
      setError("Imeshindikana kupakia matangazo yaliyoidhinishwa.");
    } finally {
      setLoadingApproved(false);
    }
  }, []);

  useEffect(() => {
    void loadPending();
    void loadApproved();
  }, [loadPending, loadApproved]);

  const reviewListing = async (
    listing: MineralListing,
    status: "approved" | "rejected"
  ) => {
    const action = status === "approved" ? "kuidhinisha" : "kukataa";

    if (!window.confirm(
      `Una uhakika unataka ${action} tangazo la ${listing.mineralType}?`
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
          ? "Tangazo limeidhinishwa."
          : "Tangazo limekataliwa."
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.status === 403
          ? "Server imekataa ruhusa ya admin."
          : "Imeshindikana kuhifadhi uamuzi. Jaribu tena."
      );
    } finally {
      setBusyId("");
    }
  };

  const deleteListing = async (listing: MineralListing) => {
    const confirmed = window.confirm(
      `TAHADHARI: Unataka kufuta kabisa tangazo la ${listing.mineralType} - ${listing.description}?`
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

      setMessage("Tangazo lililochaguliwa limefutwa.");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.status === 403
          ? "Huna ruhusa ya kufuta tangazo."
          : err?.response?.status === 404
          ? "Tangazo halijapatikana."
          : "Imeshindikana kufuta tangazo. Jaribu tena."
      );
    } finally {
      setBusyId("");
    }
  };

  const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #ddd",
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
      <p><strong>Eneo:</strong> {listing.location}</p>
      <p><strong>Uzito:</strong> {listing.weight} {listing.weightUnit}</p>
      <p>
        <strong>Bei:</strong>{" "}
        {Number(listing.price).toLocaleString()} {listing.currency}
      </p>
      <p><strong>Mawasiliano:</strong> {listing.contact}</p>
      <p>
        <strong>Muuzaji:</strong>{" "}
        @{listing.sellerUsername || "Haijatajwa"}
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
            {busyId === listing._id ? "Inafuta..." : "Futa tangazo"}
          </button>
        ) : (
          <>
            <button
              type="button"
              style={{ ...button, background: "#176b43" }}
              onClick={() => void reviewListing(listing, "approved")}
              disabled={busyId === listing._id}
            >
              {busyId === listing._id ? "Inahifadhi..." : "Idhinisha"}
            </button>

            <button
              type="button"
              style={{ ...button, background: "#9b2929" }}
              onClick={() => void reviewListing(listing, "rejected")}
              disabled={busyId === listing._id}
            >
              {busyId === listing._id ? "Inahifadhi..." : "Kataa"}
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
        background: "#172b24",
        color: "#fff",
        padding: 22,
        borderRadius: 12,
        marginBottom: 20,
      }}>
        <h1>GFAMOUS Admin Dashboard</h1>
        <p>Usimamizi wa matangazo ya madini.</p>
        <Link to="/" style={{ color: "#fff" }}>
          Rudi sokoni
        </Link>
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
        <h2>Matangazo yanayosubiri: {pending.length}</h2>
        <button
          type="button"
          style={{ ...button, background: "#176b43" }}
          onClick={() => void loadPending()}
          disabled={loading}
        >
          {loading ? "Inapakia..." : "Onyesha upya"}
        </button>
      </section>

      {loading && <p>Inapakia matangazo yanayosubiri...</p>}

      {!loading && pending.length === 0 && (
        <section style={card}>
          Hakuna tangazo linalosubiri ukaguzi kwa sasa.
        </section>
      )}

      {pending.map((listing) => renderListing(listing, false))}

      <section style={card}>
        <h2>Matangazo yaliyoidhinishwa: {approved.length}</h2>
        <button
          type="button"
          style={{ ...button, background: "#176b43" }}
          onClick={() => void loadApproved()}
          disabled={loadingApproved}
        >
          {loadingApproved ? "Inapakia..." : "Onyesha upya"}
        </button>
      </section>

      {loadingApproved && <p>Inapakia matangazo yaliyoidhinishwa...</p>}

      {!loadingApproved && approved.length === 0 && (
        <section style={card}>
          Hakuna tangazo lililoidhinishwa kwa sasa.
        </section>
      )}

      {approved.map((listing) => renderListing(listing, true))}
    </main>
  );
}
