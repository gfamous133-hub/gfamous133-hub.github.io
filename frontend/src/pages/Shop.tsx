import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import Header from "../components/Header";
import SignIn from "../components/SignIn";
import { useAuth } from "../hooks/useAuth";
import { axiosClient } from "../lib/axiosClient";
import { useLanguage } from "../contexts/LanguageContext";

interface MineralListing {
  _id?: string;
  id?: string;
  mineralType: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  weight: number;
  weightUnit: string;
  price: number;
  currency: string;
  contact?: string;
  phone?: string;
  whatsapp?: string;
  imageUrls?: string[];
  sellerName?: string;
  createdAt?: string;
}

interface ListingForm {
  mineralType: string;
  description: string;
  location: string;
  weight: string;
  weightUnit: string;
  price: string;
  currency: string;
  phone: string;
  whatsapp: string;
  imageUrls: string;
}

interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

interface ListingFilters {
  mineralType: string;
  location: string;
  minWeight: string;
  minWeightUnit: string;
  maxWeight: string;
  maxWeightUnit: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
}

const initialForm: ListingForm = {
  mineralType: "",
  description: "",
  location: "",
  weight: "",
  weightUnit: "kg",
  price: "",
  currency: "TZS",
  phone: "",
  whatsapp: "",
  imageUrls: "",
};

const initialFilters: ListingFilters = {
  mineralType: "",
  location: "",
  minWeight: "",
  minWeightUnit: "g",
  maxWeight: "",
  maxWeightUnit: "g",
  minPrice: "",
  maxPrice: "",
  currency: "ALL",
};

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Chaguo za madini zinazotumika kwenye utafutaji na fomu ya tangazo.
const MINERAL_OPTIONS = [
  { value: "Gold", label: "Gold / Dhahabu" },
  { value: "Silver", label: "Silver / Fedha" },
  { value: "Copper", label: "Copper / Shaba" },
  { value: "Diamond", label: "Diamond / Almasi" },
  { value: "Tanzanite", label: "Tanzanite" },
  { value: "Sapphire", label: "Sapphire / Yakuti samawi" },
  { value: "Ruby", label: "Ruby / Yakuti nyekundu" },
  { value: "Emerald", label: "Emerald / Zumaridi" },
  { value: "Tourmaline", label: "Tourmaline" },
  { value: "Garnet", label: "Garnet" },
  { value: "Quartz", label: "Quartz / Jiwe la quartz" },
  { value: "Graphite", label: "Graphite" },
  { value: "Tin", label: "Tin / Bati" },
  { value: "Iron", label: "Iron / Chuma" },
  { value: "Nickel", label: "Nickel" },
  { value: "Cobalt", label: "Cobalt" },
  { value: "Lithium", label: "Lithium" },
  { value: "Gypsum", label: "Gypsum / Jasiwe" },
  { value: "Other", label: "Other / Madini mengine" },
];

const pageStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "20px",
  fontFamily: "Arial, sans-serif",
  color: "#17243b",
} as const;

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #d8aa35",
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "18px",
} as const;

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  marginBottom: "14px",
  border: "1px solid #d8aa35",
  borderRadius: "7px",
  boxSizing: "border-box" as const,
  fontSize: "15px",
};

const buttonStyle = {
  background: "#10213b",
  color: "white",
  border: "none",
  borderRadius: "7px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: "bold" as const,
};

const weightInGrams = (weight: number, unit: string): number => {
  return unit.toLowerCase() === "kg" ? weight * 1000 : weight;
};

const Shop = () => {
  const { t, language } = useLanguage();
  const {
    user,
    isAuthenticated,
    showSignIn,
    signIn,
    signOut,
    closeSignIn,
    requireAuth,
    isLoading: isAuthLoading,
  } = useAuth();

  const [listings, setListings] = useState<MineralListing[]>([]);
  const [form, setForm] = useState<ListingForm>(initialForm);
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formGpsPosition, setFormGpsPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchGpsPosition, setSearchGpsPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsRadiusKm, setGpsRadiusKm] = useState("100");
  const [isLocating, setIsLocating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchListings = useCallback(async () => {
    setIsLoadingListings(true);
    setError("");

    try {
      const response = await axiosClient.get("/mineral-listings/approved");

      setListings(
        Array.isArray(response.data?.listings)
          ? response.data.listings
          : []
      );
    } catch (err) {
      console.error("Error loading mineral listings:", err);
      setError(t("approvedLoadFailed"));
    } finally {
      setIsLoadingListings(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

  const requestDeviceLocation = (
    onSuccess: (position: { latitude: number; longitude: number }) => void,
    fillListingLocation = false
  ) => {
    setGpsMessage("");
    if (!navigator.geolocation) {
      setGpsMessage("GPS haipatikani kwenye kifaa au kivinjari hiki.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        };
        onSuccess(coordinates);

        if (fillListingLocation) {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&localityLanguage=sw`
            );
            if (!response.ok) throw new Error("Reverse geocoding failed");
            const place = await response.json();
            const locality = place.locality || place.city || "";
            const areaName = [
              locality || place.principalSubdivision,
              place.principalSubdivision && place.principalSubdivision !== locality ? place.principalSubdivision : "",
              place.countryName,
            ].filter(Boolean).join(", ");

            if (areaName) {
              setForm((previous) => ({ ...previous, location: areaName }));
              setGpsMessage(`Eneo limetambuliwa na kujazwa: ${areaName}`);
            } else {
              setGpsMessage("GPS imepata coordinates, lakini jina la eneo halikupatikana. Unaweza kuliandika mwenyewe.");
            }
          } catch (error) {
            console.error("Location name lookup failed:", error);
            setGpsMessage("GPS imepata coordinates, lakini jina la eneo halikupatikana. Jaribu tena au liandike mwenyewe.");
          }
        } else {
          setGpsMessage("GPS imefanikiwa kutambua eneo lako.");
        }
        setIsLocating(false);
      },
      (geoError) => {
        setIsLocating(false);
        const message = geoError.code === 1
          ? "Ruhusu GFAMOUS kutumia location kwenye mipangilio ya simu."
          : geoError.code === 2
            ? "Eneo halijatambulika. Washa GPS na ujaribu tena."
            : "Muda wa kutambua eneo umeisha. Jaribu tena.";
        setGpsMessage(message);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  };

  const distanceInKm = (
    first: { latitude: number; longitude: number },
    second: { latitude: number; longitude: number }
  ) => {
    const toRadians = (degrees: number) => degrees * Math.PI / 180;
    const earthRadiusKm = 6371;
    const dLat = toRadians(second.latitude - first.latitude);
    const dLon = toRadians(second.longitude - first.longitude);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) *
      Math.sin(dLon / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFilterChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const filteredListings = listings.filter((listing) => {
    const mineralSearch = filters.mineralType.trim().toLowerCase();
    const locationSearch = filters.location.trim().toLowerCase();

    if (
      mineralSearch &&
      !listing.mineralType.toLowerCase().includes(mineralSearch)
    ) {
      return false;
    }

    if (
      locationSearch &&
      !listing.location.toLowerCase().includes(locationSearch)
    ) {
      return false;
    }

    const grams = weightInGrams(
      Number(listing.weight),
      listing.weightUnit || "g"
    );

    const minWeightGrams = Number(filters.minWeight) * (filters.minWeightUnit === "kg" ? 1000 : 1);
    const maxWeightGrams = Number(filters.maxWeight) * (filters.maxWeightUnit === "kg" ? 1000 : 1);

    if (filters.minWeight !== "" && grams < minWeightGrams) {
      return false;
    }

    if (filters.maxWeight !== "" && grams > maxWeightGrams) {
      return false;
    }

    if (
      filters.currency !== "ALL" &&
      listing.currency.toUpperCase() !== filters.currency
    ) {
      return false;
    }

    if (searchGpsPosition) {
      if (typeof listing.latitude !== "number" || typeof listing.longitude !== "number") return false;
      if (distanceInKm(searchGpsPosition, { latitude: listing.latitude, longitude: listing.longitude }) > Number(gpsRadiusKm)) return false;
    }

    // Bei za sarafu tofauti hazilinganishwi pamoja.
    // Chagua TZS au USD ili kutumia kichujio cha bei.
    if (filters.currency !== "ALL") {
      if (
        filters.minPrice !== "" &&
        Number(listing.price) < Number(filters.minPrice)
      ) {
        return false;
      }

      if (
        filters.maxPrice !== "" &&
        Number(listing.price) > Number(filters.maxPrice)
      ) {
        return false;
      }
    }

    return true;
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess("");

    const files = Array.from(event.target.files || []);

    if (files.length > MAX_IMAGES) {
      setSelectedFiles([]);
      event.target.value = "";
      setError(t("maxFiveImages"));
      return;
    }

    for (const file of files) {
      if (!allowedImageTypes.includes(file.type)) {
        setSelectedFiles([]);
        event.target.value = "";
        setError(t("imageTypes"));
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setSelectedFiles([]);
        event.target.value = "";
        setError(t("imageSize"));
        return;
      }
    }

    setSelectedFiles(files);
  };
    // Upload images directly from the phone to Cloudinary.
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) {
      return [];
    }

    let signatureResponse;

    try {
      signatureResponse = await axiosClient.post<CloudinarySignature>(
        "/mineral-listings/images/sign"
      );
    } catch (err) {
      console.error("Cloudinary signature request failed:", err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 401) {
          throw new Error(t("sessionExpired"));
        }

        if (status === 503) {
          throw new Error(
            t("uploadUnavailable")
          );
        }

        throw new Error(
          `${t("uploadPermission")} HTTP: ${
            status || "hakuna majibu kutoka server"
          }.`
        );
      }

      throw new Error(t("uploadPermission"));
    }

    const {
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    } = signatureResponse.data || ({} as CloudinarySignature);

    if (!cloudName || !apiKey || !timestamp || !folder || !signature) {
      console.error(
        "Incomplete Cloudinary signature response:",
        signatureResponse.data
      );

      throw new Error(
        "Server imerudisha taarifa za Cloudinary ambazo hazijakamilika."
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const uploadData = new FormData();

      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("timestamp", String(timestamp));
      uploadData.append("folder", folder);
      uploadData.append("signature", signature);

      let uploadResponse: Response;

      try {
        uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: uploadData,
          }
        );
      } catch (err) {
        console.error("Cloudinary network request failed:", err);

        throw new Error(
          `Pi Browser imeshindwa kuwasiliana na Cloudinary wakati wa kupakia ${file.name}. Hakikisha intaneti inafanya kazi, kisha jaribu tena. Maelezo: ${
            err instanceof Error ? err.message : "Network error"
          }`
        );
      }

      let uploadResult: {
        secure_url?: string;
        error?: { message?: string };
      };

      try {
        uploadResult = await uploadResponse.json();
      } catch (err) {
        console.error("Cloudinary returned an unreadable response:", err);

        throw new Error(
          `Cloudinary imerudisha majibu yasiyosomeka kwa picha ${file.name}. HTTP ${uploadResponse.status}.`
        );
      }

      if (!uploadResponse.ok || !uploadResult.secure_url) {
        console.error("Cloudinary upload rejected:", {
          status: uploadResponse.status,
          result: uploadResult,
          fileName: file.name,
        });

        throw new Error(
          `Cloudinary imekataa picha ${file.name}: ${
            uploadResult.error?.message ||
            `HTTP ${uploadResponse.status}`
          }`
        );
      }

      uploadedUrls.push(uploadResult.secure_url);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    const weight = Number(form.weight);
    const price = Number(form.price);

    if (!form.mineralType.trim() || !form.description.trim()) {
      setError(t("fillMineralDescription"));
      return;
    }

    if (!form.location.trim() || !form.phone.trim() || !form.whatsapp.trim()) {
      setError(t("fillLocationContact"));
      return;
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      setError(t("invalidWeight"));
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError(t("invalidPrice"));
      return;
    }

    const existingImageUrls = form.imageUrls
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    if (existingImageUrls.length + selectedFiles.length > MAX_IMAGES) {
      setError(t("maxFiveImages"));
      return;
    }

    for (const url of existingImageUrls) {
      try {
        const parsedUrl = new URL(url);

        if (parsedUrl.protocol !== "https:") {
          setError(t("httpsOnly"));
          return;
        }
      } catch {
        setError(t("invalidImageLink"));
        return;
      }
    }

    for (const file of selectedFiles) {
      if (!allowedImageTypes.includes(file.type)) {
        setError(t("imageTypes"));
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setError(t("imageSize"));
        return;
      }
    }

    setIsSubmitting(true);

    let currentStage = "kupakia picha kutoka Gallery";

    try {
      const uploadedUrls = await uploadImages(selectedFiles);

      currentStage = "kutuma tangazo kwenye server";

      const imageUrls = [
        ...existingImageUrls,
        ...uploadedUrls,
      ];

      await axiosClient.post("/mineral-listings", {
        mineralType: form.mineralType.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        latitude: formGpsPosition?.latitude,
        longitude: formGpsPosition?.longitude,
        weight,
        weightUnit: form.weightUnit,
        price,
        currency: form.currency,
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        imageUrls,
      });

      setSuccess(
        t("submitted")
      );

      setForm(initialForm);
      setFormGpsPosition(null);
      setSelectedFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      void fetchListings();
    } catch (err) {
      console.error(
        `Error during ${currentStage}:`,
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : `Imeshindikana ${currentStage}. Tafadhali jaribu tena.`;

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleInspectionRequest = async (listing: MineralListing) => {
    const listingId = listing._id || listing.id;
    if (!listingId) return;
    if (!isAuthenticated) { requireAuth(); return; }
    const messages: Record<string, { prompt: string; sent: string; failed: string }> = {
      sw: { prompt: "Eleza unachotaka kikaguliwe (uzito, eneo au sampuli):", sent: "Ombi limepokelewa. Bado hatujathibitisha wakala katika eneo hili. Tutawasiliana nawe baada ya kupitia ombi.", failed: "Imeshindikana kutuma ombi. Jaribu tena." },
      en: { prompt: "What should be checked (weight, location or sample)?", sent: "Request received. No agent has yet been confirmed for this area. We will contact you after review.", failed: "Could not submit the request. Please try again." },
      fr: { prompt: "Que faut-il vérifier (poids, lieu ou échantillon) ?", sent: "Demande reçue. Aucun agent n'est encore confirmé dans cette zone. Nous vous contacterons après examen.", failed: "Impossible d'envoyer la demande. Réessayez." },
      ar: { prompt: "ما الذي تريد فحصه (الوزن أو الموقع أو العينة)؟", sent: "تم استلام الطلب. لم يتم تأكيد وكيل في هذه المنطقة بعد. سنتواصل معك بعد المراجعة.", failed: "تعذر إرسال الطلب. حاول مرة أخرى." },
      zh: { prompt: "需要检查什么（重量、地点或样品）？", sent: "已收到申请。目前尚未确认该地区有代理人员。审核后我们会联系您。", failed: "提交失败，请重试。" },
      es: { prompt: "¿Qué debe comprobarse (peso, ubicación o muestra)?", sent: "Solicitud recibida. Aún no hay un agente confirmado en esta zona. Nos pondremos en contacto tras revisarla.", failed: "No se pudo enviar la solicitud. Inténtalo de nuevo." },
      pt: { prompt: "O que deve ser verificado (peso, local ou amostra)?", sent: "Pedido recebido. Ainda não há agente confirmado nesta região. Entraremos em contato após a análise.", failed: "Não foi possível enviar o pedido. Tente novamente." },
    };
    const copy = messages[language] || messages.en;
    const reason = window.prompt(copy.prompt);
    if (!reason || !reason.trim()) return;
    try {
      await axiosClient.post("/mineral-listings/inspection-requests", { listingId, reason: reason.trim() });
      window.alert(copy.sent);
    } catch (err) {
      console.error("Inspection request failed:", err);
      window.alert(copy.failed);
    }
  };

  const handleReport = async (listing: MineralListing) => {
    const listingId = listing._id || listing.id;

    if (!listingId) {
      setError(t("reportFailed"));
      return;
    }

    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    const reason = window.prompt(
      t("reportReason")
    );

    if (!reason || !reason.trim()) {
      return;
    }

    try {
      await axiosClient.post(
        `/mineral-listings/${listingId}/report`,
        { reason: reason.trim() }
      );

      window.alert(t("reportThanks"));
    } catch (err) {
      console.error("Error reporting listing:", err);
      window.alert(t("reportFailed"));
    }
  };

  const onSendTestNotification = () => {
    if (!user?.uid) return;

    axiosClient.post("/notifications/send", {
      notifications: [
        {
          title: "Test Notification",
          body: "This is a test notification",
          user_uid: user.uid,
          subroute: "/shop",
        },
      ],
    }).catch((err) => {
      console.error("Notification error:", err);
    });
  };
    return (
    <>
      <Header
        user={user}
        onSignIn={signIn}
        onSignOut={signOut}
        onSendTestNotification={onSendTestNotification}
        isLoading={isAuthLoading}
      />

      <main style={pageStyle}>
        <section
          style={{
            background: "linear-gradient(135deg, #f7d45b 0%, #e9b936 58%, #d8aa35 100%)",
            color: "#17243b",
            padding: "35px 20px",
            borderRadius: "14px",
            marginBottom: "25px",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: "0 0 12px" }}>
            GFAMOUS MINERAL MARKET
          </h1>

          <p style={{ lineHeight: 1.6 }}>
            {t("welcome")}
          </p>

          <p style={{ fontSize: "14px", fontWeight: 700 }}>
            {t("tagline")}
          </p>
        </section>

        <section style={cardStyle}>
          <h2>{t("listings")}</h2>

          <p style={{ color: "#666" }}>
            {t("approvedOnly")}
          </p>

          <button
            type="button"
            style={buttonStyle}
            onClick={() => void fetchListings()}
            disabled={isLoadingListings}
          >
            {isLoadingListings ? t("loading") : t("refresh")}
          </button>

          {isLoadingListings && <p>{t("loadingListings")}</p>}

          {error && (
            <p role="alert" style={{ color: "#b00020" }}>
              {error}
            </p>
          )}

          {!isLoadingListings && listings.length === 0 && !error && (
            <p>
              {t("noListings")}
            </p>
          )}

          {/* Filters zinaonekana hata kama hakuna matangazo */}
          <div
            style={{
              background: "#fff8e5",
              border: "1px solid #d8aa35",
              borderRadius: "10px",
              padding: "15px",
              marginTop: "20px",
            }}
          >
            <h3>{t("filters")}</h3>

            <label htmlFor="filterMineral">{t("mineralType")}</label>
            <select
              id="filterMineral"
              name="mineralType"
              value={filters.mineralType}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              <option value="">Madini yote / All minerals</option>
              {Array.from(new Set([
                ...MINERAL_OPTIONS.map((item) => item.value),
                ...listings.map((item) => item.mineralType).filter(Boolean),
              ])).sort().map((type) => {
                const option = MINERAL_OPTIONS.find((item) => item.value.toLowerCase() === type.toLowerCase());
                return <option key={type} value={type}>{option?.label || type}</option>;
              })}
            </select>

            <button
              type="button"
              style={{ ...buttonStyle, marginBottom: "12px", background: "#b8860b" }}
              disabled={isLocating}
              onClick={() => requestDeviceLocation(setSearchGpsPosition)}
            >
              {isLocating ? "Inatafuta GPS..." : searchGpsPosition ? "Tumia upya GPS yangu" : "Tafuta madini karibu nami (GPS)"}
            </button>
            {searchGpsPosition && (
              <div style={{ marginBottom: "12px", fontSize: "13px" }}>
                GPS: {searchGpsPosition.latitude}, {searchGpsPosition.longitude}
                <button type="button" onClick={() => setSearchGpsPosition(null)} style={{ ...buttonStyle, padding: "6px 10px", marginLeft: "8px", background: "#555" }}>Zima GPS</button>
                <label htmlFor="gpsRadiusKm" style={{ display: "block", marginTop: "8px" }}>Umbali wa kutafuta</label>
                <select id="gpsRadiusKm" value={gpsRadiusKm} onChange={(event) => setGpsRadiusKm(event.target.value)} style={inputStyle}>
                  <option value="10">Ndani ya km 10</option>
                  <option value="25">Ndani ya km 25</option>
                  <option value="50">Ndani ya km 50</option>
                  <option value="100">Ndani ya km 100</option>
                  <option value="250">Ndani ya km 250</option>
                  <option value="500">Ndani ya km 500</option>
                  <option value="1000">Ndani ya km 1,000</option>
                </select>
              </div>
            )}
            {gpsMessage && <p role="status" style={{ color: "#8a641c" }}>{gpsMessage}</p>}

            <label htmlFor="filterLocation">Location / Eneo</label>
            <select
              id="filterLocation"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              <option value="">Maeneo yote</option>
              {Array.from(new Set(listings.map((item) => item.location).filter(Boolean))).sort().map((place) => (
                <option key={place} value={place}>{place}</option>
              ))}
            </select>

            <label htmlFor="filterMinWeight">{t("minWeight")}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="filterMinWeight"
                name="minWeight"
                type="number"
                min="0"
                value={filters.minWeight}
                onChange={handleFilterChange}
                placeholder="1"
                style={{ ...inputStyle, flex: 1 }}
              />
              <select name="minWeightUnit" value={filters.minWeightUnit} onChange={handleFilterChange} style={{ ...inputStyle, width: "95px" }}>
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>

            <label htmlFor="filterMaxWeight">{t("maxWeight")}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="filterMaxWeight"
                name="maxWeight"
                type="number"
                min="0"
                value={filters.maxWeight}
                onChange={handleFilterChange}
                placeholder="1000"
                style={{ ...inputStyle, flex: 1 }}
              />
              <select name="maxWeightUnit" value={filters.maxWeightUnit} onChange={handleFilterChange} style={{ ...inputStyle, width: "95px" }}>
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>

            <label htmlFor="filterCurrency">{t("currency")}</label>
            <select
              id="filterCurrency"
              name="currency"
              value={filters.currency}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              <option value="ALL">{t("allCurrencies")}</option>
              <option value="TZS">TZS</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="PI">Pi</option>
            </select>

            <label htmlFor="filterMinPrice">{t("minPrice")}</label>
            <input
              id="filterMinPrice"
              name="minPrice"
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder={t("minPricePlaceholder")}
              style={inputStyle}
            />

            <label htmlFor="filterMaxPrice">{t("maxPrice")}</label>
            <input
              id="filterMaxPrice"
              name="maxPrice"
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder={t("maxPricePlaceholder")}
              style={inputStyle}
            />

            <button
              type="button"
              style={{ ...buttonStyle, background: "#555" }}
              onClick={() => setFilters(initialFilters)}
            >
              {t("clearFilters")}
            </button>

            <p>
              <strong>
                {t("results")}: {filteredListings.length} {t("of")} {listings.length} {t("listingsWord")}
              </strong>
            </p>
          </div>

          {!isLoadingListings &&
            listings.length > 0 &&
            filteredListings.length === 0 && (
              <p>{t("noMatches")}</p>
            )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            {filteredListings.map((listing, index) => (
              <article
                key={listing._id || listing.id || index}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: "white",
                }}
              >
                {listing.imageUrls && listing.imageUrls.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: "4px",
                    }}
                  >
                    {listing.imageUrls.map((imageUrl, imageIndex) => (
                      <img
                        key={`${imageUrl}-${imageIndex}`}
                        src={imageUrl}
                        alt={`${listing.mineralType} picha ${imageIndex + 1}`}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "150px",
                          objectFit: "cover",
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      height: "130px",
                      background: "#eeeeee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                    }}
                  >
                    {t("noImage")}
                  </div>
                )}

                <div style={{ padding: "15px" }}>
                  <h3>{listing.mineralType}</h3>
                  <p>{listing.description}</p>

                  <p>
                    <strong>{t("location")}:</strong> {listing.location}
                    {typeof listing.latitude === "number" && typeof listing.longitude === "number" && (
                      <>{" · "}<a href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`} target="_blank" rel="noreferrer">Fungua ramani</a></>
                    )}
                  </p>

                  <p>
                    <strong>{t("weight")}:</strong> {listing.weight}{" "}
                    {listing.weightUnit}
                  </p>

                  <p>
                    <strong>{t("price")}:</strong>{" "}
                    {listing.price.toLocaleString()} {listing.currency}
                  </p>

                  <p>
                    <strong>{t("sellerContact")}:</strong> {listing.phone || listing.contact || "—"}<br />
                    <strong>WhatsApp:</strong> {listing.whatsapp || listing.phone || listing.contact || "—"}
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleReport(listing)}
                    style={{
                      ...buttonStyle,
                      background: "#8b2929",
                      marginTop: "8px",
                    }}
                  >
                    {t("report")}
                  </button>
                  <button type="button" onClick={() => void handleInspectionRequest(listing)} style={{ ...buttonStyle, background: "#8a641c", marginTop: "8px", width: "100%" }}>
                    {language === "sw" ? "Omba ukaguzi huru" : language === "fr" ? "Demander une inspection" : language === "ar" ? "طلب فحص مستقل" : language === "zh" ? "申请独立检验" : language === "es" ? "Solicitar inspección" : language === "pt" ? "Solicitar inspeção" : "Request independent inspection"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          <h2>{t("submitListing")}</h2>

          <p style={{ color: "#666" }}>
            {t("sellerIntro")}
          </p>

          {!isAuthenticated && (
            <p>
              {t("signInToSubmit")}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="mineralType">{t("mineralType")} *</label>
            <select
              id="mineralType"
              name="mineralType"
              value={form.mineralType}
              onChange={handleInputChange}
              style={inputStyle}
              required
            >
              <option value="">Chagua aina ya madini / Select mineral</option>
              {MINERAL_OPTIONS.map((mineral) => (
                <option key={mineral.value} value={mineral.value}>{mineral.label}</option>
              ))}
            </select>

            <label htmlFor="description">{t("description")} *</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder={t("mineralDetailsPlaceholder")}
              style={{ ...inputStyle, minHeight: "100px" }}
              required
            />

            <label htmlFor="locationPreset">Chagua eneo (hiari)</label>
            <select
              id="locationPreset"
              value=""
              onChange={(event) => {
                if (event.target.value) {
                  setForm((previous) => ({ ...previous, location: event.target.value }));
                }
              }}
              style={inputStyle}
            >
              <option value="">Chagua eneo au andika hapa chini</option>
              <option value="Nyamongo, Mara, Tanzania">Nyamongo, Mara, Tanzania</option>
              <option value="Tarime, Mara, Tanzania">Tarime, Mara, Tanzania</option>
              <option value="Mwanza, Tanzania">Mwanza, Tanzania</option>
              <option value="Geita, Tanzania">Geita, Tanzania</option>
              <option value="Shinyanga, Tanzania">Shinyanga, Tanzania</option>
              <option value="Dar es Salaam, Tanzania">Dar es Salaam, Tanzania</option>
              <option value="Other">Other / Eneo jingine</option>
            </select>
            <label htmlFor="location">{t("location")} *</label>
            <button
              type="button"
              style={{ ...buttonStyle, marginBottom: "10px", background: "#b8860b" }}
              disabled={isLocating}
              onClick={() => requestDeviceLocation(setFormGpsPosition, true)}
            >
              {isLocating ? "Inatambua eneo..." : formGpsPosition ? "Sasisha GPS ya tangazo" : "Tambua eneo langu kwa GPS"}
            </button>
            {formGpsPosition && (
              <p style={{ fontSize: "13px", color: "#555" }}>
                GPS imehifadhiwa: {formGpsPosition.latitude}, {formGpsPosition.longitude}. Weka pia jina la eneo ili wanunuzi walielewe.
              </p>
            )}
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleInputChange}
              placeholder={t("locationPlaceholder")}
              style={inputStyle}
              required
            />

            <label htmlFor="weight">{t("weight")} *</label>
            <input
              id="weight"
              name="weight"
              type="number"
              min="0.001"
              step="any"
              value={form.weight}
              onChange={handleInputChange}
              placeholder={t("weightPlaceholder")}
              style={inputStyle}
              required
            />

            <label htmlFor="weightUnit">{t("weightUnit")}</label>
            <select
              id="weightUnit"
              name="weightUnit"
              value={form.weightUnit}
              onChange={handleInputChange}
              style={inputStyle}
            >
              <option value="kg">{t("kilogram")}</option>
              <option value="g">{t("gram")}</option>
            </select>

            <label htmlFor="price">{t("price")} *</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0.01"
              step="any"
              value={form.price}
              onChange={handleInputChange}
              placeholder={t("pricePlaceholder")}
              style={inputStyle}
              required
            />

            <label htmlFor="currency">{t("currency")}</label>
            <select
              id="currency"
              name="currency"
              value={form.currency}
              onChange={handleInputChange}
              style={inputStyle}
            >
              <option value="TZS">{t("tzs")}</option>
              <option value="USD">{t("usd")}</option>
              <option value="EUR">EUR</option>
              <option value="PI">Pi</option>
            </select>

            <label htmlFor="phone">{t("sellerContact")} *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleInputChange}
              placeholder="+255 7XX XXX XXX"
              style={inputStyle}
              required
            />

            <label htmlFor="whatsapp">WhatsApp Number *</label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              value={form.whatsapp}
              onChange={handleInputChange}
              placeholder="+255 7XX XXX XXX"
              style={inputStyle}
              required
            />

            <label htmlFor="imageFiles">
              {t("chooseImages")}
            </label>
            <input
              ref={fileInputRef}
              id="imageFiles"
              name="imageFiles"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              style={inputStyle}
            />

            <p style={{ fontSize: "13px", color: "#666" }}>
              {t("imageRules")}
            </p>

            {selectedFiles.length > 0 && (
              <div
                style={{
                  background: "#fff8e5",
                  padding: "12px",
                  borderRadius: "7px",
                  marginBottom: "14px",
                }}
              >
                <strong>{t("selectedImages")}: {selectedFiles.length}</strong>

                {selectedFiles.map((file, index) => (
                  <p
                    key={`${file.name}-${index}`}
                    style={{ fontSize: "13px" }}
                  >
                    {file.name} - {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                ))}

                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: "#8b2929",
                    padding: "8px 12px",
                  }}
                  onClick={() => {
                    setSelectedFiles([]);

                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  {t("removeImages")}
                </button>
              </div>
            )}

            <label htmlFor="imageUrls">
              {t("imageLinks")}
            </label>
            <textarea
              id="imageUrls"
              name="imageUrls"
              value={form.imageUrls}
              onChange={handleInputChange}
              placeholder={t("imageLinksPlaceholder")}
              style={{ ...inputStyle, minHeight: "90px" }}
            />

            <p style={{ fontSize: "13px", color: "#666" }}>
              {t("imageLinkRules")}
            </p>

            {success && (
              <p
                role="status"
                style={{ color: "#10213b", fontWeight: "bold" }}
              >
                {success}
              </p>
            )}

            {error && (
              <p role="alert" style={{ color: "#b00020" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                ...buttonStyle,
                width: "100%",
                opacity: isSubmitting ? 0.6 : 1,
              }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("uploadingSubmitting")
                : t("submit")}
            </button>
          </form>
        </section>

        <footer
          style={{
            textAlign: "center",
            padding: "20px",
            color: "#666",
            fontSize: "13px",
          }}
        >
          <p>GFAMOUS MINERAL MARKET</p>
          <p>{t("footerContact")}: gfamous133@gmail.com</p>

          <p>
            <a href="https://gfamous133-hub.github.io/demo/privacy-policy.html">
              {t("privacy")}
            </a>
            {" | "}
            <a href="https://gfamous133-hub.github.io/demo/terms-of-service.html">
              {t("terms")}
            </a>
          </p>
        </footer>
      </main>

      {showSignIn && (
        <SignIn
          onSignIn={signIn}
          onModalClose={closeSignIn}
          disabled={isAuthLoading}
        />
      )}
    </>
  );
};

export default Shop;
