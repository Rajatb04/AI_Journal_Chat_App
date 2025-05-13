import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import journalRoutes from './routes/journal.js';
import aiRoutes from './routes/ai.js';
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log(process.env.MONGODB_URI)

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));


app.use('/api/auth', authRoutes);
app.use('/api/journal', verifyToken, journalRoutes);
app.use('/api/ai', verifyToken, aiRoutes);


app.get('/', (req, res) => {
  res.send('AI Journal API is running');
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});