// module type server use es6 feature

import express from "express"
import cors from "cors"
import { connectDB } from "./Config/db.js"
import foodRouter from "./routes/FoodRoute.js"
import userRouter from "./routes/userRoute.js"
import 'dotenv/config.js'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"



// app config
const app = express()
const port = process.env.port ||4000;


// middleware
app.use(express.json()) // we get request from
// fe to be that will be parsed through this json
app.use(cors()) // using this we can access backend from any fe


// db connection 
connectDB();

// api endPoints
app.use("/api/food",foodRouter)
app.use('/images', express.static('uploads'))
app.use("/api/user", userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)



app.get("/",(req, res)=>{
    res.send("API Working")
})

app.listen(port,()=>{
    console.log(`Server Started on http://localhost:${port}`)
})

