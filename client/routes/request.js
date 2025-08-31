import express from 'express'
import { sendRequest , AcceptRequest , RejectRequest, setname } from '../controllers/request.js'
let RequestRoute = express.Router()

RequestRoute.post('/send-request' , sendRequest)
RequestRoute.post('/accept-request' , AcceptRequest)
RequestRoute.post('/reject-request' , RejectRequest)
RequestRoute.post('/setname' , setname)

export {RequestRoute}