require('dotenv').config();

const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const eventRoutes = require('./routes/event.routes');
const integrationRoutes = require('./routes/integration.routes');
const matchRoutes = require('./routes/match.routes');
const moderationRoutes = require('./routes/moderation.routes');

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'MixUp API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/moderation', moderationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`API running on http://localhost:${port}`));
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
