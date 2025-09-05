import { data, loadData, saveData } from './dataStore.js';

loadData(); // Load previous data if exists

async function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('register', (userId) => {
      data.users[userId] = socket.id;
      io.to(socket.id).emit('registered', socket.id);
      socket.broadcast.emit('Online-status', userId);

      // Deliver pending messages
      if (data.PendingMessages[userId]) {
        data.PendingMessages[userId].forEach(msg => {
          io.to(socket.id).emit('recieve-message', msg);
        });
        delete data.PendingMessages[userId];
      }

      // Deliver pending requests
      if (data.PendingRequests[userId]) {
        data.PendingRequests[userId].forEach(req => {
          io.to(socket.id).emit('recieved-request', req);
        });
        delete data.PendingRequests[userId];
      }

      // Deliver pending approvals
      if (data.pendingApprovals[userId]) {
        data.pendingApprovals[userId].forEach(req => {
          io.to(socket.id).emit('accepted', req);
        });
        delete data.pendingApprovals[userId];
      }

      saveData();
    });

    // Send message
    socket.on('send-message', (obj) => {
      const msg = {
        from: obj.from,
        msg: obj.msg,
        Time: new Date().toISOString(),
        Date: new Date().toISOString()
      };

      const toSocket = data.users[obj.to];
      if (toSocket) {
        io.to(toSocket).emit('recieve-message', msg);
      } else {
        if (!data.PendingMessages[obj.to]) data.PendingMessages[obj.to] = [];
        data.PendingMessages[obj.to].push(msg);
      }

      saveData();
    });

    // Send request
    socket.on('send-request', (obj) => {
      const senderObj = { username: obj.myusername, avatar: obj.myavatar, userId: obj.myuserId };
      const toSocket = data.users[obj.userId];
      if (toSocket) {
        io.to(toSocket).emit('recieved-request', senderObj);
      } else {
        if (!data.PendingRequests[obj.userId]) data.PendingRequests[obj.userId] = [];
        data.PendingRequests[obj.userId].push(senderObj);
      }

      saveData();
    });

    // Accept request
    socket.on('accept-request', (obj) => {
      const approval = { username: obj.username, avatar: obj.avatar, userId: obj.myuserId };
      const toSocket = data.users[obj.userId];
      if (toSocket) {
        io.to(toSocket).emit('accepted', approval);
      } else {
        if (!data.pendingApprovals[obj.userId]) data.pendingApprovals[obj.userId] = [];
        data.pendingApprovals[obj.userId].push(approval);
      }

      saveData();
    });

    // User disconnect
    socket.on('user-disconnect', (contacts, id) => {
      socket.broadcast.emit('Offline-status', id);
      saveData();
    });

    // Remove user from users on disconnect
    socket.on('disconnect', () => {
      for (const [userId, id] of Object.entries(data.users)) {
        if (id === socket.id) {
          delete data.users[userId];
          break;
        }
      }
      saveData();
      console.log('Users:', data.users);
    });
  });
}

export default socketHandler;
