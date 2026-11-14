
import { Router } from "express";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";
import type { UserData } from "../types/user";

export default function mountMineralListingEndpoints(router: Router) {
  const isModerator = (
    user: UserData | null | undefined
  ): user is UserData =>
    !!user &&
    Array.isArray(user.roles) &&
    user.roles.some((role: string) =>
      ["core_team", "admin"].includes(role)
    );

  const validEvidenceUrls = (value: unknown): value is string[] => {
    if (value === undefined) return true;
    if (!Array.isArray(value) || value.length > 3) return false;
    return value.every((item) => {
      if (typeof item !== "string") return false;
      try {
        const url = new URL(item);
        return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
      } catch {
        return false;
      }
    });
  };

  // Display approved mineral listings
  router.get("/approved", async (req, res) => {
    try {
      const collection = req.app.locals.mineralListingCollection;

      if (!collection) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const listings = await collection
        .find({ status: "approved" })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ listings });
    } catch (error) {
      console.error("Error loading mineral listings:", error);
      return res.status(500).json({ error: "Failed to load listings" });
    }
  });


  // Stores a buyer request only; no agent availability or verification is implied.
  router.post("/inspection-requests", async (req, res) => {
    try {
      const user = req.session.currentUser;
      if (!user) return res.status(401).json({ error: "Please sign in first" });
      const listingId = String(req.body.listingId || "");
      const reason = String(req.body.reason || "").trim();
      const evidenceImageUrls = req.body.evidenceImageUrls;
      if (!ObjectId.isValid(listingId) || !reason || reason.length > 1000) {
        return res.status(400).json({ error: "A valid listing and inspection reason are required" });
      }
      if (!validEvidenceUrls(evidenceImageUrls)) {
        return res.status(400).json({ error: "Evidence must contain up to 3 valid Cloudinary image URLs" });
      }
      const listings = req.app.locals.mineralListingCollection;
      const requests = req.app.locals.inspectionRequestCollection;
      if (!listings || !requests) return res.status(503).json({ error: "Database unavailable" });
      const listing = await listings.findOne({ _id: new ObjectId(listingId), status: "approved" });
      if (!listing) return res.status(404).json({ error: "Approved listing not found" });
      const existing = await requests.findOne({ listingId: new ObjectId(listingId), buyerId: user._id, status: { $in: ["requested", "reviewing"] } });
      if (existing) return res.status(409).json({ error: "You already have an open inspection request for this listing" });
      const result = await requests.insertOne({
        listingId: new ObjectId(listingId), buyerId: user._id, buyerUsername: user.username,
        sellerId: listing.sellerId, sellerUsername: listing.sellerUsername,
        mineralType: listing.mineralType, listingLocation: listing.location, reason,
        evidenceImageUrls: evidenceImageUrls || [],
        status: "requested", agentAssigned: false, feeQuoted: false,
        createdAt: new Date(), updatedAt: new Date(),
      });
      return res.status(201).json({ message: "Inspection request received", requestId: result.insertedId, status: "requested" });
    } catch (error) {
      console.error("Error creating inspection request:", error);
      return res.status(500).json({ error: "Failed to submit inspection request" });
    }
  });

  // Inspection requests are visible to moderators only.
  router.get("/inspection-requests", async (req, res) => {
    try {
      if (!isModerator(req.session.currentUser)) {
        return res.status(403).json({ error: "Moderator access required" });
      }
      const requests = req.app.locals.inspectionRequestCollection;
      if (!requests) return res.status(503).json({ error: "Database unavailable" });
      const items = await requests.find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
      return res.status(200).json({ requests: items });
    } catch (error) {
      console.error("Error loading inspection requests:", error);
      return res.status(500).json({ error: "Failed to load inspection requests" });
    }
  });

  // Moderators can only move requests between the explicitly supported review states.
  router.patch("/inspection-requests/:id/status", async (req, res) => {
    try {
      const user = req.session.currentUser;
      if (!isModerator(user)) {
        return res.status(403).json({ error: "Moderator access required" });
      }
      const requestId = req.params.id;
      const status = req.body.status;
      if (!ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: "Invalid inspection request ID" });
      }
      if (!["reviewing", "declined"].includes(status)) {
        return res.status(400).json({ error: "Unsupported inspection request status" });
      }
      const requests = req.app.locals.inspectionRequestCollection;
      if (!requests) return res.status(503).json({ error: "Database unavailable" });
      const result = await requests.updateOne(
        { _id: new ObjectId(requestId), status: { $in: ["requested", "reviewing"] } },
        { $set: { status, reviewedBy: user.username, reviewedAt: new Date(), updatedAt: new Date() } }
      );
      if (!result.matchedCount) {
        return res.status(404).json({ error: "Open inspection request not found" });
      }
      return res.status(200).json({ message: "Inspection request status updated", status });
    } catch (error) {
      console.error("Error updating inspection request:", error);
      return res.status(500).json({ error: "Failed to update inspection request" });
    }
  });

  // Display pending listings to moderators
  router.get("/pending", async (req, res) => {
    try {
      const user = req.session.currentUser;

      if (!isModerator(user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const collection = req.app.locals.mineralListingCollection;

      if (!collection) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const listings = await collection
        .find({ status: "pending" })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ listings });
    } catch (error) {
      console.error("Error loading pending listings:", error);
      return res.status(500).json({
        error: "Failed to load pending listings",
      });
    }
  });

  // Create secure Cloudinary upload signature
  router.post("/images/sign", async (req, res) => {
    try {
      const user = req.session.currentUser;

      if (!user) {
        return res.status(401).json({ error: "Please sign in first" });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(503).json({
          error: "Image upload service is not configured",
        });
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "gfamous/mineral-listings";
      const signatureString = `folder=${folder}&timestamp=${timestamp}`;

      const signature = createHash("sha1")
        .update(signatureString + apiSecret)
        .digest("hex");

      return res.status(200).json({
        cloudName,
        apiKey,
        timestamp,
        folder,
        signature,
      });
    } catch (error) {
      console.error("Error creating Cloudinary signature:", error);
      return res.status(500).json({
        error: "Failed to prepare image upload",
      });
    }
  });

  // Signed uploads for buyer evidence use a separate fixed Cloudinary folder.
  router.post("/evidence/images/sign", async (req, res) => {
    try {
      if (!req.session.currentUser) {
        return res.status(401).json({ error: "Please sign in first" });
      }
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(503).json({ error: "Image upload service is not configured" });
      }
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "gfamous/buyer-evidence";
      const signatureString = `folder=${folder}&timestamp=${timestamp}`;
      const signature = createHash("sha1")
        .update(signatureString + apiSecret)
        .digest("hex");
      return res.status(200).json({ cloudName, apiKey, timestamp, folder, signature });
    } catch (error) {
      console.error("Error creating evidence upload signature:", error);
      return res.status(500).json({ error: "Failed to prepare evidence image upload" });
    }
  });

  // Submit a mineral listing for moderation
  router.post("/", async (req, res) => {
    try {
      const user = req.session.currentUser;

      if (!user) {
        return res.status(401).json({ error: "Please sign in first" });
      }

      const collection = req.app.locals.mineralListingCollection;

      if (!collection) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const {
        mineralType,
        description,
        location,
        weight,
        weightUnit,
        price,
        currency,
        contact,
        phone,
        whatsapp,
        imageUrls,
      } = req.body;

      if (
        !mineralType ||
        !description ||
        !location ||
        weight === undefined ||
        !weightUnit ||
        price === undefined ||
        !currency ||
        !(phone || contact) ||
        !(whatsapp || phone || contact)
      ) {
        return res.status(400).json({
          error: "Please complete all required fields",
        });
      }

      const images = Array.isArray(imageUrls) ? imageUrls : [];

      if (images.length > 5) {
        return res.status(400).json({
          error: "Maximum 5 image URLs allowed",
        });
      }

      const validImages = images.every((url: unknown) => {
        if (typeof url !== "string") return false;

        try {
          return new URL(url).protocol === "https:";
        } catch {
          return false;
        }
      });

      if (!validImages) {
        return res.status(400).json({
          error: "Images must use valid HTTPS URLs",
        });
      }

      const listing = {
        sellerId: user._id,
        sellerUsername: user.username,
        mineralType: String(mineralType).trim(),
        description: String(description).trim(),
        location: String(location).trim(),
        ...(req.body.latitude !== undefined && req.body.longitude !== undefined
          ? { latitude: Number(req.body.latitude), longitude: Number(req.body.longitude) }
          : {}),
        weight: Number(weight),
        weightUnit: String(weightUnit),
        price: Number(price),
        currency: String(currency),
        phone: String(phone || contact).trim(),
        whatsapp: String(whatsapp || phone || contact).trim(),
        contact: String(phone || contact).trim(),
        imageUrls: images,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (
        (req.body.latitude !== undefined || req.body.longitude !== undefined) &&
        (!Number.isFinite(listing.latitude) || listing.latitude < -90 || listing.latitude > 90 ||
          !Number.isFinite(listing.longitude) || listing.longitude < -180 || listing.longitude > 180)
      ) {
        return res.status(400).json({ error: "GPS coordinates are invalid" });
      }

      if (
        !Number.isFinite(listing.weight) ||
        listing.weight <= 0 ||
        !Number.isFinite(listing.price) ||
        listing.price <= 0
      ) {
        return res.status(400).json({
          error: "Weight and price must be positive numbers",
        });
      }

      const result = await collection.insertOne(listing);

      return res.status(201).json({
        message: "Listing submitted for review",
        listingId: result.insertedId,
        status: "pending",
      });
    } catch (error) {
      console.error("Error creating mineral listing:", error);
      return res.status(500).json({ error: "Failed to submit listing" });
    }
  });

  // Evidence reports are visible to moderators only.
  router.get("/reports", async (req, res) => {
    try {
      if (!isModerator(req.session.currentUser)) {
        return res.status(403).json({ error: "Moderator access required" });
      }
      const reports = req.app.locals.reportCollection;
      if (!reports) return res.status(503).json({ error: "Database unavailable" });
      const items = await reports.find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
      return res.status(200).json({ reports: items });
    } catch (error) {
      console.error("Error loading listing reports:", error);
      return res.status(500).json({ error: "Failed to load reports" });
    }
  });

  // Report an approved mineral listing
  router.post("/:id/report", async (req, res) => {
    try {
      const listingId = req.params.id;

      if (!ObjectId.isValid(listingId)) {
        return res.status(400).json({ error: "Invalid listing ID" });
      }

      const reports = req.app.locals.reportCollection;
      const listings = req.app.locals.mineralListingCollection;

      if (!reports || !listings) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const listing = await listings.findOne({
        _id: new ObjectId(listingId),
        status: "approved",
      });

      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      const reason = String(req.body.reason || "").trim();
      const evidenceImageUrls = req.body.evidenceImageUrls;

      if (!reason) {
        return res.status(400).json({
          error: "Please provide a report reason",
        });
      }

      if (!validEvidenceUrls(evidenceImageUrls)) {
        return res.status(400).json({ error: "Evidence must contain up to 3 valid Cloudinary image URLs" });
      }

      await reports.insertOne({
        listingId: new ObjectId(listingId),
        reason,
        evidenceImageUrls: evidenceImageUrls || [],
        reporterId: req.session.currentUser?._id || null,
        reporterUsername: req.session.currentUser?.username || null,
        status: "open",
        createdAt: new Date(),
      });

      return res.status(201).json({
        message: "Report submitted for review",
      });
    } catch (error) {
      console.error("Error reporting listing:", error);
      return res.status(500).json({ error: "Failed to submit report" });
    }
  });

  // Delete one approved listing - moderators only
  router.delete("/:id", async (req, res) => {
    try {
      const user = req.session.currentUser;

      if (!isModerator(user)) {
        return res.status(403).json({
          error: "Moderator access required",
        });
      }

      const listingId = req.params.id;

      if (!ObjectId.isValid(listingId)) {
        return res.status(400).json({ error: "Invalid listing ID" });
      }

      const collection = req.app.locals.mineralListingCollection;

      if (!collection) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const result = await collection.deleteOne({
        _id: new ObjectId(listingId),
        status: "approved",
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          error: "Approved listing not found",
        });
      }

      return res.status(200).json({
        message: "Approved listing deleted",
      });
    } catch (error) {
      console.error("Error deleting approved listing:", error);
      return res.status(500).json({
        error: "Failed to delete listing",
      });
    }
  });

  // Approve or reject listings by authorized moderators
  router.patch("/:id/moderation", async (req, res) => {
    try {
      const user = req.session.currentUser;

      if (!isModerator(user)) {
        return res.status(403).json({
          error: "Moderator access required",
        });
      }

      const listingId = req.params.id;
      const status = req.body.status;

      if (!ObjectId.isValid(listingId)) {
        return res.status(400).json({ error: "Invalid listing ID" });
      }

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          error: "Status must be approved or rejected",
        });
      }

      const collection = req.app.locals.mineralListingCollection;

      if (!collection) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const result = await collection.updateOne(
        {
          _id: new ObjectId(listingId),
          status: "pending",
        },
        {
          $set: {
            status,
            reviewedBy: user.username,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          error: "Pending listing not found",
        });
      }

      return res.status(200).json({
        message: `Listing ${status}`,
      });
    } catch (error) {
      console.error("Error moderating listing:", error);
      return res.status(500).json({
        error: "Failed to review listing",
      });
    }
  });
}
