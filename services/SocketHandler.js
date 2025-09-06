import { userModel } from "../client/models/User.js"

let users = {}
let PendingMessages = {}
let PendingRequests = {}
let pendingApprovals = {}

async function socketHandler(io) {
    io.on('connection', (socket) => {
        console.log(socket.id)

        socket.on('register', (userId) => {
            users[userId] = socket.id
            io.to(users[userId]).emit('registered', socket.id)
            console.log(users)
            socket.broadcast.emit('Online-status', userId)
            if (PendingMessages[userId]) {
                PendingMessages[userId].forEach((msg) => {
                    io.to(users[userId]).emit('recieve-message', msg)
                    console.log('Delivered pending message : ', msg)
                });
                delete PendingMessages[userId]
            }
            if (PendingRequests[userId]) {
                PendingRequests[userId].forEach((request) => {
                    io.to(users[userId]).emit('recieved-request', request)
                })
                delete PendingRequests[userId]
            }
            if (pendingApprovals[userId]) {
                pendingApprovals[userId].forEach((request) => {
                    io.to(users[userId]).emit('accepted', request)
                })
                delete pendingApprovals[userId]
            }
        })

        socket.on('check-register', (id, callback) => {
            console.log(id);
            if (users[id]) {
                callback({ exists: true, socketId: users[id] });
            } else {
                callback({ exists: false });
            }
        });

        socket.on('send-message', (obj) => {
            console.log(obj)
            let obj1 = {
                from: obj.from,
                msg: obj.msg,
                Time: new Date().toISOString(),
                Date: new Date().toISOString()
            }
            console.log(obj1)
            if (users[obj.to]) {
                io.to(users[obj.to]).emit('recieve-message', obj1)
            } else {
                if (!PendingMessages[obj.to]) PendingMessages[obj.to] = []
                PendingMessages[obj.to].push(obj1)
            }
        })

        socket.on('send-request', (obj) => {
            console.log('send', obj)
            let senderObj = {
                username: obj.myusername,
                avatar: obj.myavatar,
                userId: obj.myuserId
            }
            let recieverObj = {
                username: obj.username,
                avatar: obj.avatar,
                userId: obj.userId
            }
            if (users[obj.userId]) {
                io.to(users[obj.userId]).emit('recieved-request', senderObj)
            } else {
                if (!PendingRequests[obj.userId]) PendingRequests[obj.userId] = []
                PendingRequests[obj.userId].push(senderObj)
            }
        })

        socket.on('accept-request', (obj) => {
            console.log(obj)
            let obj2 = {
                username: obj.username,
                avatar: obj.avatar,
                userId: obj.myuserId
            }
            let userId = obj.userId
            if (users[obj.userId]) {
                io.to(users[obj.userId]).emit('accepted', obj2)
            } else {
                if (!pendingApprovals[obj.userId]) pendingApprovals[obj.userId] = []
                pendingApprovals[obj.userId].push(obj2)
            }
        })

        socket.on('user-disconnect', async (contacts, id) => {
            socket.broadcast.emit('Offline-status', id)
            try {
                //console.log(contacts, id)
                // let findUser = await userModel.findOneAndUpdate(
                //     { clerkId: id },
                //     {
                //         $set: {
                //             contacts: JSON.parse(contacts)
                //         }
                //     },
                //     { new: true }
                // )
                //console.log(findUser)
            } catch (err) {
                console.log(err)
            }
        })

        socket.on('disconnect', () => {
            for (const [userId, id] of Object.entries(users)) {
                if (id === socket.id) {
                    delete users[userId]
                    break;
                }
            }
            console.log(users)
        })
    })
}

export default socketHandler