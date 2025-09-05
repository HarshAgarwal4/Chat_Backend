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

app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(clerkMiddleware({
  authorizedParties: [process.env.FRONTEND_URL]
}));

// const publicRoutes = ["/", "/unauth", "/test-cors", "/public"];
// app.use((req, res, next) => {
//   if (publicRoutes.some((path) => req.path === path || req.path.startsWith(path))) {
//     return next();
//   }
//   return requireAuth()(req, res, next);
// });

app.use("/", userRoute);
app.use("/", RequestRoute);

app.get("/", (req, res) => {
  console.log(req)
  return res.send(req)
});
app.get("/unauth", (req, res) => {
  console.log(req.cookies);
  res.send("Unauth");
});
app.get("/test-cors", (req, res) => {
  res.send({ msg: "CORS is working", origin: req.headers.origin });
});

socketHandler(io);

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
