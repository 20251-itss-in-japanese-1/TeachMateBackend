const dotenv = require('dotenv')
const express = require('express')
const connectDB = require('./config/db')
const routes = require('./routes/index')
const cors = require('cors')
dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
connectDB()
const port = 3000
app.use(routes)
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.url}`);
    console.error(err.stack); // in chi tiết stack trace
    res.status(500).json({ error: 'Server error', message: err.message });
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
