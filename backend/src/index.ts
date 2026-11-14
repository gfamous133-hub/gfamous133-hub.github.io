import fs from "fs";
import path from "path";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import logger from "morgan";
import MongoStore from "connect-mongo";
import { MongoClient } from "mongodb";
import env from "./environments";
import mountPaymentsEndpoints from "./handlers/payments";
import mountUserEndpoints from "./handlers/users";
import mountNotificationEndpoints from "./handlers/notifications";
import mountMineralListingEndpoints from "./handlers/mineralListings";
import "./types/session";

if (!env.mongodb_uri) {
  throw new Error("MONGODB_URI environment variable is required");
}

if (!env.session_secret || env.session_secret === "This is my session secret") {
  throw new Error("A secure SESSION_SECRET environment variable is required");
}

const app: express.Application = express();

app.set("trust proxy", 1);

app.use(logger("dev"));

app.use(
  logger("common", {
    stream: fs.createWriteStream(
      path.join(__dirname, "..", "log", "access.log"),
      { flags: "a" }
    ),
  })
);

app.use(express.json());

app.use(
  cors({
    origin: env.frontend_url,
    credentials: true,
  })
);

app.use(cookieParser());

const mongoClientOptions = {
  serverSelectionTimeoutMS: 10000,
};

app.use(
  session({
    secret: env.session_secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: env.mongodb_uri,
      mongoOptions: mongoClientOptions,
      collectionName: "user_sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }) as unknown as express.RequestHandler
);

const paymentsRouter = express.Router();
mountPaymentsEndpoints(paymentsRouter);
app.use("/payments", paymentsRouter);

const userRouter = express.Router();
mountUserEndpoints(userRouter);
app.use("/user", userRouter);

const notificationRouter = express.Router();
mountNotificationEndpoints(notificationRouter);
app.use("/notifications", notificationRouter);

const mineralListingRouter = express.Router();
mountMineralListingEndpoints(mineralListingRouter);
app.use("/mineral-listings", mineralListingRouter);

app.get("/", async (_, res) => {
  res.status(200).send({
    message: "GFAMOUS MINERAL MARKET API is running",
  });
});

app.get("/health", async (_, res) => {
  res.status(200).json({
    status: "ok",
    message: "GFAMOUS MINERAL MARKET API is running",
  });
});

const start = async () => {
  let client: MongoClient | undefined;

  try {
    client = new MongoClient(env.mongodb_uri, mongoClientOptions);
    await client.connect();

    const db = client.db();

    app.locals.orderCollection = db.collection("orders");
    app.locals.userCollection = db.collection("users");
    app.locals.mineralListingCollection = db.collection("mineral_listings");
    app.locals.reportCollection = db.collection("reports");
    app.locals.inspectionRequestCollection = db.collection("inspection_requests");

    console.log("Connected to MongoDB Atlas successfully.");

    app.listen(env.port, () => {
      console.log(`GFAMOUS backend listening on port ${env.port}`);
    });
  } catch (err) {
    console.error("MongoDB connection or server startup failed.");
    console.error(err instanceof Error ? err.message : "Unknown error");

    if (client) {
      await client.close().catch(() => undefined);
    }

    process.exit(1);
  }
};

start();
