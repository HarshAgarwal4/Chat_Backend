import { clerkMiddleware , clerkClient, requireAuth, getAuth  } from '@clerk/express'
import { userModel } from '../models/User.js'

async function saveUser(req , res) {
	const {UserId} = req.body 
	try{
		const user = await clerkClient.users.getUser(UserId)
		let obj = new userModel({
			clerkId: user.id,
			username: user.username,
			email: user.emailAddresses[0].emailAddress,
			avatar: user.imageUrl
		})
		await obj.save()
		return res.send({status:1, msg:"user saved"})
	}catch(err){
		console.log(err)
		return res.send({status:0, msg:"Internal Server Error"})
	}
}

async function fetchUser(req,res){
	const {UserId} = req.body
	try{
		let findUser = await userModel.findOne({clerkId: UserId})
		if(!findUser) return res.send({status: 2, msg:"User not found"})
		return res.send({status:1 , msg:"User found" , user:findUser})
	}catch(err) {
		console.log(err)
		return res.send({status:0 , msg:"internal server error"})
	}
}

async function loadUsers(req,res) {
	try{
		const users = await userModel.find()
		if(!users) return res.send({status: 2, msg:"Users not found"})
		 const userArray = users.map(user => ({
            username: user.username,
            avatar: user.avatar,
            clerkId: user.clerkId
        }));

		return res.send({status:1, users:userArray})
	}catch(err){
		console.log(err)
		return res.send({status:0,msg:"error occured"})
	}
}

export {saveUser , fetchUser , loadUsers }