import { clerkClient } from "@clerk/express"

async function isLoggedIn(id) {
    if(!id) return {status: 0 , msg:"Not Authenticated"}

    let user = await clerkClient.users.getUser(id)

    if(!user) return {status: 0 , msg:"Not Authenticated"}
    if(user) return {status:1 , user: user}
}

export {isLoggedIn}