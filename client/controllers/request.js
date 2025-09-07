import { getAuth } from "@clerk/express"
import { userModel } from "../models/User.js"

async function sendRequest(req, res) {
    let { to, username, avatar, myUsername, myavatar , UserId } = req.body
    try {
        let updateUser = await userModel.findOneAndUpdate(
            { clerkId: to }
            ,
            {
                $addToSet: {
                    IncomingRequests: {
                        From: {
                            userId : UserId,
                            avatar: myavatar,
                            username: myUsername
                        },
                        status: "Pending"
                    }
                },

            },
            {
                new: true
            })
        if (!updateUser) return res.send({ status: 2, msg: "request not send" })
        let updateSender = await userModel.findOneAndUpdate(
            { clerkId: UserId },
            {
                $addToSet: {
                    SendRequest: {
                        To: {
                            userId: to,
                            username,
                            avatar
                        }
                    }
                }
            },
            { new: true }
        )
        if (!updateSender) return res.send({ status: 2, msg: "request failed" })
        if (updateSender && updateUser) return res.send({ status: 1, msg: "request Sended" })
    } catch (err) {
        console.log(err)
        return res.send({ status: 0, msg: "server error" })
    }
}

async function AcceptRequest(req, res) {
    let { id, username, avatar, myusername, myavatar , UserId} = req.body
    try {
        let updateSender = await userModel.findOneAndUpdate(
            { clerkId: UserId },
            {
                $pull: {
                    IncomingRequests: {"From.userId" : id}
                },
                $addToSet:{
                    contacts:{
                        username: username,
                        userId: id,
                        DisplayName: username || null,
                        avatar: avatar,
                        messages: []
                    }
                }
            },
            {new: true}
        )
        if(!updateSender) return res.send({status:2 , msg:"request not accepted"})
        let updateUser = await userModel.findOneAndUpdate(
            {clerkId: id},
            {
                $pull:{
                    SendRequest:{"To.userId" : UserId}
                },
                $addToSet:{
                    contacts:{
                        username: myusername,
                        userId: UserId,
                        DisplayName: myusername || null,
                        avatar: myavatar,
                        messages: []
                    }
                }
            },
            {new:true}
        )
        if(!updateUser) return res.send({status:2 , msg:"request failed"})
        if(updateSender && updateUser) {
            return res.send({status:1,msg:"Requested accepted"})
        }
    }
    catch(err){
        console.log(err)
        return res.send({status:0 , msg:"Internal Server error"})
    }
}

async function RejectRequest(req, res) {
    let { id , UserId} = req.body

    try {
        let updateRecipient = await userModel.findOneAndUpdate(
            { clerkId: UserId },
            {
                $pull: { IncomingRequests: { "From.userId": id } }
            },
            { new: true }
        )
        if (!updateRecipient) return res.send({ status: 2, msg: "request not found" })

        let updateSender = await userModel.findOneAndUpdate(
            { clerkId: id, "SendRequest.To.userId": UserId },
            {
                $set: { "SendRequest.$.status": "Rejected" }
            },
            { new: true }
        )
        if (!updateSender) return res.send({ status: 2, msg: "request failed" })

        return res.send({ status: 1, msg: "Request rejected" })
    } catch (err) {
        console.log(err)
        return res.send({ status: 0, msg: "Internal Server error" })
    }
}

async function setname(req , res) {
    let {id , name  , userId} = req.body
    console.log(id , name , userId)
    try{
        let updatedUser = await userModel.findOneAndUpdate(
            {clerkId: userId , "contacts.userId" : id},
            {$set:{
                "contacts.$.DisplayName" : name
            }},
            {new:true}
        )
        console.log(updatedUser)
        if(!updatedUser) return res.send({status: 2 , msg:"Updation failed"})
        if(updatedUser) return res.send({status: 1, msg:"Updation succesfull"})
    }catch(err) {
        console.log(err)
        return res.send({status:0, msg:"Internal server error"})
    }
}

export { sendRequest , AcceptRequest , RejectRequest , setname}