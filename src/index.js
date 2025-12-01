const dotenv = require('dotenv')
const express = require('express')
const connectDB = require('./config/db')
const session = require('express-session');

const routes = require('./routes/index')
const passport = require('./config/authStrategy')
const Socket = require('./socket/socket');
const http = require('http');
const cors = require('cors')

dotenv.config()
const app = express()
const server = http.createServer(app);
app.use(cors({
    origin: ['http://localhost:3001', 'https://teach-mate-frontend.vercel.app/'], // URL FE
    credentials: true, // cho phép gửi cookie
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true nếu dùng HTTPS
    sameSite: 'lax'
  }
}));
Socket.initSocket(server)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(passport.initialize());
app.use(passport.session());
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
