import express, { application, json } from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { ClerkWebhooks, stripeWebhooks } from './controllers/webhooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import connectCloudinary from './configs/cloudinary.js'
import courseRouter from './routes/courseRoute.js'
import userRouter from './routes/userRoute.js'
import forumRouter from './routes/forumRoute.js'
import chatRouter from './routes/chatRoute.js'
import certificateRouter from './routes/certificateRoutes.js'
import progressRouter from './routes/progressRoutes.js'

//initailize Express
const app = express()

//connect to database

await connectDB()

await connectCloudinary()

//middlewares
app.use(cors())
app.use(clerkMiddleware())

//Routes
app.get('/', (req, res)=>res.send('API is working'))
app.post('/clerk', express.json(),ClerkWebhooks)
app.use('/api/educator', express.json(), educatorRouter)
app.use('/api/course', express.json(), courseRouter)
app.use('/api/user', express.json(), userRouter)
app.use('/api/forum', express.json(), forumRouter)
app.use('/api/chat', express.json(), chatRouter)
app.use('/api/certificate', certificateRouter)
app.use('/api/progress', express.json(), progressRouter)
app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhooks)

//Port
const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})