import express from 'express'
import {saveUser , fetchUser, loadUsers } from '../controllers/user.js'
let userRoute = express.Router()

userRoute.post('/saveUser' , saveUser)
userRoute.post('/me' ,fetchUser)
userRoute.get('/loadUsers' ,loadUsers )

export {userRoute}