require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

mongoose.connect(MONGODB_URI, {
  dbName: MONGODB_DB,
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.set('io', io);

// Auth routes
app.use('/api/auth', require('./routes/auth'));
// Product routes
app.use('/api/products', require('./routes/products'));
// Category routes
app.use('/api/categories', require('./routes/categories'));
// Brand routes
app.use('/api/brands', require('./routes/brands'));
// Movement log routes
app.use('/api/logs', require('./routes/logs'));
// Alert routes
app.use('/api/alerts', require('./routes/alerts'));

app.use('/api/users', require('./routes/users'));
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 