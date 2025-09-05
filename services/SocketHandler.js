import { userModel } from "../client/models/User.js";

// Using Map instead of plain objects
let users = new Map();
let PendingMessages = new Map();
let PendingRequests = new Map();
let pendingApprovals = new Map();

async function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log(socket.id);

    // --- Register user ---
    socket.on('register', (userId) => {
      users.set(userId, socket.id);
      io.to(socket.id).emit('registered', socket.id);
      console.log('Users:', Array.from(users.entries()));

      socket.broadcast.emit('Online-status', userId);

      // Deliver pending messages
      if (PendingMessages.has(userId)) {
        PendingMessages.get(userId).forEach(msg => {
          io.to(socket.id).emit('recieve-message', msg);
          console.log('Delivered pending message:', msg);
        });
        PendingMessages.delete(userId);
      }

      // Deliver pending requests
      if (PendingRequests.has(userId)) {
        PendingRequests.get(userId).forEach(request => {
          io.to(socket.id).emit('recieved-request', request);
        });
        PendingRequests.delete(userId);
      }

      // Deliver pending approvals
      if (pendingApprovals.has(userId)) {
        pendingApprovals.get(userId).forEach(request => {
          io.to(socket.id).emit('accepted', request);
        });
        pendingApprovals.delete(userId);
      }
    });

    // --- Send message ---
    socket.on('send-message', (obj) => {
      const msg = {
        from: obj.from,
        msg: obj.msg,
        Time: new Date().toISOString(),
        Date: new Date().toISOString()
      };

      if (users.has(obj.to)) {
        io.to(users.get(obj.to)).emit('recieve-message', msg);
      } else {
        if (!PendingMessages.has(obj.to)) PendingMessages.set(obj.to, []);
        PendingMessages.get(obj.to).push(msg);
      }
    });

    // --- Send friend request ---
    socket.on('send-request', (obj) => {
      const senderObj = {
        username: obj.myusername,
        avatar: obj.myavatar,
        userId: obj.myuserId
      };

      if (users.has(obj.userId)) {
        io.to(users.get(obj.userId)).emit('recieved-request', senderObj);
      } else {
        if (!PendingRequests.has(obj.userId)) PendingRequests.set(obj.userId, []);
        PendingRequests.get(obj.userId).push(senderObj);
      }
    });

    // --- Accept friend request ---
    socket.on('accept-request', (obj) => {
      const approval = {
        username: obj.username,
        avatar: obj.avatar,
        userId: obj.myuserId
      };

      if (users.has(obj.userId)) {
        io.to(users.get(obj.userId)).emit('accepted', approval);
      } else {
        if (!pendingApprovals.has(obj.userId)) pendingApprovals.set(obj.userId, []);
        pendingApprovals.get(obj.userId).push(approval);
      }
    });

    // --- User disconnect ---
    socket.on('user-disconnect', async (contacts, id) => {
      socket.broadcast.emit('Offline-status', id);
      try {
        // Optional: update contacts in DB
      } catch (err) {
        console.log(err);
      }
    });

    // --- Remove user from online list on disconnect ---
    socket.on('disconnect', () => {
      for (const [userId, id] of users.entries()) {
        if (id === socket.id) {
          users.delete(userId);
          break;
        }
      }
      console.log('Users after disconnect:', Array.from(users.entries()));
    });
  });
}

export default socketHandler;
