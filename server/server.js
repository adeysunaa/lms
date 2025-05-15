import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connect } from 'mongoose'
import connectDB from './configs/mongodb.js'
import { ClerkWebhooks } from './controllers/webhooks.js'

//initailize Express
const app = express()

//connect to database

await connectDB()

//middlewares
app.use(cors())

//Routes
app.get('/', (req, res)=>res.send('API is working'))
app.post('/clerk', express.json(),ClerkWebhooks)

//Port
const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})