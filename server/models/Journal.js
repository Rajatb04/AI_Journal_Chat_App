import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const journalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  messages: [messageSchema],
  summary: {
    type: String,
    default: ''
  },
  mood: {
    type: String,
    enum: ['happy', 'neutral', 'sad', 'anxious', 'excited', 'tired', 'stressed', 'calm', ''],
    default: ''
  }
});

journalSchema.index({ user: 1, date: -1 });

const Journal = mongoose.model('Journal', journalSchema);

export default Journal;