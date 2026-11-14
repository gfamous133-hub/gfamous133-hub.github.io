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
  weight: number;
  weightUnit: string;
  price: number;
  currency: string;
  contact: string;
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
  contact: string;
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
  maxWeight: string;
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
  contact: "",
  imageUrls: "",
};

const initialFilters: ListingFilters = {
  mineralType: "",
  location: "",
  minWeight: "",
  maxWeight: "",
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

const pageStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "20px",
  fontFamily: "Arial, sans-serif",
  color: "#202020",
} as const;

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e2e2",
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "18px",
} as const;

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  marginBottom: "14px",
  border: "1px solid #cccccc",
  borderRadius: "7px",
  boxSizing: "border-box" as const,
  fontSize: "15px",
};

const buttonStyle = {
  background: "#176b43",
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
  const { t } = useLanguage();
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
      setError(t("pendingLoadFailed"));
    } finally {
      setIsLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

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

    if (filters.minWeight !== "" && grams < Number(filters.minWeight)) {
      return false;
    }

    if (filters.maxWeight !== "" && grams > Number(filters.maxWeight)) {
      return false;
    }

    if (
      filters.currency !== "ALL" &&
      listing.currency.toUpperCase() !== filters.currency
    ) {
      return false;
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
          `Imeshindikana kupata ruhusa ya kupakia picha. HTTP: ${
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

    if (!form.location.trim() || !form.contact.trim()) {
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
        weight,
        weightUnit: form.weightUnit,
        price,
        currency: form.currency,
        contact: form.contact.trim(),
        imageUrls,
      });

      setSuccess(
        t("submitted")
      );

      setForm(initialForm);
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
            background: "#123d2b",
            color: "white",
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
            Soko la kuunganisha wanunuzi na wauzaji wa dhahabu
            na madini mengine.
          </p>

          <p style={{ fontSize: "14px" }}>
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
              Bado hakuna matangazo yaliyoidhinishwa.
              Unaweza kutuma tangazo lako hapa chini.
            </p>
          )}

          {/* Filters zinaonekana hata kama hakuna matangazo */}
          <div
            style={{
              background: "#f5f8f6",
              border: "1px solid #dce7df",
              borderRadius: "10px",
              padding: "15px",
              marginTop: "20px",
            }}
          >
            <h3>{t("filters")}</h3>

            <label htmlFor="filterMineral">{t("mineralType")}</label>
            <input
              id="filterMineral"
              name="mineralType"
              value={filters.mineralType}
              onChange={handleFilterChange}
              placeholder="Gold"
              style={inputStyle}
            />

            <label htmlFor="filterLocation">{t("location")}</label>
            <input
              id="filterLocation"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Nyamongo, Mara"
              style={inputStyle}
            />

            <label htmlFor="filterMinWeight">{t("minWeight")}</label>
            <input
              id="filterMinWeight"
              name="minWeight"
              type="number"
              min="0"
              value={filters.minWeight}
              onChange={handleFilterChange}
              placeholder="1"
              style={inputStyle}
            />

            <label htmlFor="filterMaxWeight">{t("maxWeight")}</label>
            <input
              id="filterMaxWeight"
              name="maxWeight"
              type="number"
              min="0"
              value={filters.maxWeight}
              onChange={handleFilterChange}
              placeholder="1000"
              style={inputStyle}
            />

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
              Futa vichujio
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
                    <strong>{t("contact")}:</strong> {listing.contact}
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
                    Ripoti tangazo
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          <h2>{t("submitListing")}</h2>

          <p style={{ color: "#666" }}>
            Wauzaji wanaweza kutuma taarifa za madini yao.
            Tangazo litakaguliwa kabla ya kuonekana kwa wanunuzi.
          </p>

          {!isAuthenticated && (
            <p>
              {t("signInToSubmit")}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="mineralType">{t("mineralType")} *</label>
            <input
              id="mineralType"
              name="mineralType"
              value={form.mineralType}
              onChange={handleInputChange}
              placeholder="Mfano: Gold, Tanzanite, Copper"
              style={inputStyle}
              required
            />

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

            <label htmlFor="location">{t("location")} *</label>
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
            </select>

            <label htmlFor="contact">{t("sellerContact")} *</label>
            <input
              id="contact"
              name="contact"
              value={form.contact}
              onChange={handleInputChange}
              placeholder={t("contactPlaceholder")}
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
              Chagua hadi picha 5. JPG, PNG au WebP.
              Kila picha isiwe kubwa kuliko MB 5.
            </p>

            {selectedFiles.length > 0 && (
              <div
                style={{
                  background: "#f2f7f3",
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
                  Ondoa picha
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
              Jumla ya picha kutoka Gallery na viungo visizidi 5.
              Viungo lazima viwe vya HTTPS.
            </p>

            {success && (
              <p
                role="status"
                style={{ color: "#176b43", fontWeight: "bold" }}
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
                ? "Inapakia picha na kutuma tangazo..."
                : "Tuma Tangazo"}
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
              Privacy Policy
            </a>
            {" | "}
            <a href="https://gfamous133-hub.github.io/demo/terms-of-service.html">
              Terms of Service
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
