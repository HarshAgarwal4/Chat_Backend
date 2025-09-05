import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { userModel } from "../client/models/User.js";

let redisClient, pubClient, subClient;

async function initRedis() {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on("error", (err) => console.error("Redis Client Error:", err));
  await redisClient.connect();

  pubClient = redisClient.duplicate();
  subClient = redisClient.duplicate();
  await pubClient.connect();
  await subClient.connect();
}

async function socketHandler(io) {
  if (!redisClient) await initRedis();

  // Attach Redis adapter for multi-instance
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    console.log("New socket connected:", socket.id);

    socket.on("register", async (userId) => {
      await redisClient.hSet("onlineUsers", userId, socket.id);
      io.to(socket.id).emit("registered", socket.id);
      socket.broadcast.emit("Online-status", userId);

      // Pending messages
      const pendingMessages = await redisClient.lRange(`pendingMessages:${userId}`, 0, -1);
      pendingMessages.forEach((msg) => io.to(socket.id).emit("recieve-message", JSON.parse(msg)));
      await redisClient.del(`pendingMessages:${userId}`);

      // Pending requests
      const pendingRequests = await redisClient.lRange(`pendingRequests:${userId}`, 0, -1);
      pendingRequests.forEach((req) => io.to(socket.id).emit("recieved-request", JSON.parse(req)));
      await redisClient.del(`pendingRequests:${userId}`);

      // Pending approvals
      const pendingApprovals = await redisClient.lRange(`pendingApprovals:${userId}`, 0, -1);
      pendingApprovals.forEach((approval) => io.to(socket.id).emit("accepted", JSON.parse(approval)));
      await redisClient.del(`pendingApprovals:${userId}`);
    });

    socket.on("send-message", async (obj) => {
      const msgObj = { from: obj.from, msg: obj.msg, Time: new Date().toISOString(), Date: new Date().toISOString() };
      const toSocketId = await redisClient.hGet("onlineUsers", obj.to);

      if (toSocketId) io.to(toSocketId).emit("recieve-message", msgObj);
      else await redisClient.lPush(`pendingMessages:${obj.to}`, JSON.stringify(msgObj));
    });

    socket.on("send-request", async (obj) => {
      const senderObj = { username: obj.myusername, avatar: obj.myavatar, userId: obj.myuserId };
      const toSocketId = await redisClient.hGet("onlineUsers", obj.userId);

      if (toSocketId) io.to(toSocketId).emit("recieved-request", senderObj);
      else await redisClient.lPush(`pendingRequests:${obj.userId}`, JSON.stringify(senderObj));
    });

    socket.on("accept-request", async (obj) => {
      const approvalObj = { username: obj.username, avatar: obj.avatar, userId: obj.myuserId };
      const toSocketId = await redisClient.hGet("onlineUsers", obj.userId);

      if (toSocketId) io.to(toSocketId).emit("accepted", approvalObj);
      else await redisClient.lPush(`pendingApprovals:${obj.userId}`, JSON.stringify(approvalObj));
    });

    socket.on("user-disconnect", async (contacts, id) => {
      socket.broadcast.emit("Offline-status", id);
      try {
        await userModel.findOneAndUpdate(
          { clerkId: id },
          { $set: { contacts: JSON.parse(contacts) } },
          { new: true }
        );
      } catch (err) {
        console.log("Error updating contacts:", err);
      }
    });

    socket.on("disconnect", async () => {
      const onlineUsers = await redisClient.hGetAll("onlineUsers");
      for (const [userId, socketId] of Object.entries(onlineUsers)) {
        if (socketId === socket.id) {
          await redisClient.hDel("onlineUsers", userId);
          break;
        }
      }
      console.log("Online users:", await redisClient.hGetAll("onlineUsers"));
    });
  });
}

export default socketHandler;
