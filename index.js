import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import cors from 'cors'
import { userRoute } from './client/routes/User.js'
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express'
import socketHandler from './services/SocketHandler.js'
import { RequestRoute } from './client/routes/request.js'
dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "https://flowchat-one.vercel.app",
    credentials: true,
  }
})

app.use(express.json());
app.use(cookieParser());
app.use(clerkMiddleware())
app.use((req, res, next) => {
  if (req.path === "/" || req.path === '/unauth' || req.path.startsWith("/public")) {
    return next() // Skip auth for these routes
  }
  return requireAuth()(req, res, next) // Apply auth everywhere else
})
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))


app.use('/', userRoute)
app.use('/', RequestRoute)
app.get('/', (req, res) => {
  res.redirect('/unauth')
})
app.get('/unauth' , (req,res)=> {
  console.log(req.cookies)
  res.send("Unauth")
})

socketHandler(io)

mongoose.connect(process.env.DB_URL, {
  dbName: "CHAT_APP",
})
  .then(() => {
    console.log("Database connected")
    httpServer.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })