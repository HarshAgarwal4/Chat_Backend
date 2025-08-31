import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
	clerkId: {
		type: String,
		unique: true,
		required: true
	},
	username: {
		type: String,
		unique: true,
		required: true
	},
	email: {
		type: String,
		unique: true,
		required: true
	},
	avatar: {
		type: String,
		required: true
	},
	IncomingRequests: [
		{
			From: {
				userId: {
					type: String,
					required: true
				},
				username: {
					required: true,
					type: String,
				},
				avatar: {
					type: String,
					required: true
				}
			},
			status: {
				type: String,
				enum: ["Accepted", "Pending", "Rejected"],
				default: "Pending"
			}
		}
	],
	SendRequest: [
		{
			To: {
				userId: {
					type: String,
					required: true
				},
				username: {
					required: true,
					type: String,
				},
				avatar: {
					type: String,
					required: true
				},
			},
			status: {
				type: String,
				enum: ["Accepted", "Pending", "Rejected"],
				default: "Pending"
			}
		}
	],
	contacts: [
		{
			username: {
				type: String,
				required: true
			},
			userId: {
				type: String,
				required: true,
			},
			DisplayName: {
				type: String,
				default: null
			},
			avatar: {
				type: String
			},
			messages: [
				{
					byMe: {
						type: Boolean,
						required: true
					},
					message: {
						type: String,
						required: true
					},
					Time:{
						type: String,
						required:true,
					},
					status:{
						type:String,
						enum: ['sent' , 'delivered' , 'seen' , 'NotByMe']
					}
				}
			]
		}
	]
}, {
	timestamps: true
})

const userModel = mongoose.model('user', UserSchema)

export { userModel }