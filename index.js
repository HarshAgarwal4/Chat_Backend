import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import cors from "cors";
import { userRoute } from "./client/routes/User.js";
import { RequestRoute } from "./client/routes/request.js";
import {
  clerkMiddleware,
  requireAuth,
} from "@clerk/express";
import socketHandler from "./services/SocketHandler.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// ----- Middleware -----
app.set("trust proxy", 1); // Important for Clerk (cookies over HTTPS)
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(clerkMiddleware());

// ----- Auth Handling -----
const publicRoutes = ["/", "/unauth", "/test-cors", "/public"];
app.use((req, res, next) => {
  if (publicRoutes.some((path) => req.path === path || req.path.startsWith(path))) {
    return next();
  }
  return requireAuth()(req, res, next);
});

// ----- Routes -----
app.use("/api/users", userRoute);
app.use("/api/requests", RequestRoute);

app.get("/", (req, res) => res.redirect("/unauth"));
app.get("/unauth", (req, res) => {
  console.log(req.cookies);
  res.send("Unauth");
});
app.get("/test-cors", (req, res) => {
  res.send({ msg: "CORS is working", origin: req.headers.origin });
});

// ----- Socket.io -----
socketHandler(io);

// ----- Database + Server -----
mongoose
  .connect(process.env.DB_URL, { dbName: "CHAT_APP" })
  .then(() => {
    console.log("✅ Database connected");
    httpServer.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  });

// ----- Global Error Handler -----
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ error: "Something went wrong" });
});
