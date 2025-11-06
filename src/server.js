const express = require('express')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const router = require('./router/router')
const cors = require('cors')
dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
connectDB()
const port = 3000
app.use(router)
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
