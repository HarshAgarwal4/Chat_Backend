import { userModel } from "../client/models/User.js"

let users = {}
let PendingMessages = {}
let CopyOfPendingMessages = {}

async function CheckChanges(Copy, Original) {
    if (JSON.stringify(Copy) === JSON.stringify(Original)) {
        Original = Copy
    }
}

async function socketHandler(io) {
    io.on('connection', (socket) => {
        console.log(socket.id)

        socket.on('register', (userId) => {
            users[userId] = socket.id
            io.to(users[userId]).emit('registered', socket.id)
            console.log(users)
            io.emit('Online-status' , userId)
            if (PendingMessages[userId]) {
                PendingMessages[userId].forEach((msg) => {
                    io.to(users[userId]).emit('recieve-message', msg)
                    console.log('Delivered pending message : ', msg)
                });
                delete PendingMessages[userId]
            }
        })

        socket.on('send-message', (obj) => {
            console.log(obj)
            let obj1 = {
                from: obj.from,
                msg: obj.msg
            }
            if (users[obj.to]) {
                io.to(users[obj.to]).emit('recieve-message', obj1)
                console.log('Hello')
            } else {
                if (!PendingMessages[obj.to]) PendingMessages[obj.to] = []
                PendingMessages[obj.to].push(obj1)
            }
        })

        socket.on('user-disconnect', async (contacts, id) => {
            try {
                console.log(contacts , id)
                let findUser = await userModel.findOneAndUpdate(
                    { clerkId: id },
                    {
                        $set: {
                            contacts: JSON.parse(contacts)
                        }
                    },
                    { new: true }
                )
                console.log(findUser)
            }catch(err) {
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