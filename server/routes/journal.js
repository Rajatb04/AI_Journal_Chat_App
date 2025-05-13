import express from 'express';
import Journal from '../models/Journal.js';
import { verifyToken } from '../middleware/auth.js';
import { startOfDay, endOfDay } from 'date-fns';

const router = express.Router();

// @route   GET api/journal
// @desc    Get all journal entries for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const journals = await Journal.find({ user: req.user.id })
      .sort({ date: -1 })
      .select('date summary mood');
    
    res.json(journals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/journal/today
// @desc    Get today's journal entry
// @access  Private
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    
    let journal = await Journal.findOne({
      user: req.user.id,
      date: {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      }
    });
    
    if (!journal) {
      journal = new Journal({
        user: req.user.id,
        date: today,
        messages: [{
          sender: 'ai',
          content: "Hello! How was your day today? I'm here to listen and help you reflect."
        }]
      });
      
      await journal.save();
    }
    
    res.json(journal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/journal/:id
// @desc    Get journal entry by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const journal = await Journal.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    res.json(journal);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   POST api/journal/message
// @desc    Add a message to today's journal
// @access  Private
router.post('/message', async (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ message: 'Message content is required' });
  }
  
  try {
    const today = new Date();
    
    let journal = await Journal.findOne({
      user: req.user.id,
      date: {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      }
    });
    
    if (!journal) {
      journal = new Journal({
        user: req.user.id,
        date: today,
        messages: [{
          sender: 'ai',
          content: "Hello! How was your day today? I'm here to listen and help you reflect."
        }]
      });
    }
    
    journal.messages.push({
      sender: 'user',
      content
    });
    
    await journal.save();
    
    res.json(journal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/journal/:id/mood
// @desc    Update journal mood
// @access  Private
router.put('/:id/mood', async (req, res) => {
  const { mood } = req.body;
  
  try {
    const journal = await Journal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { mood } },
      { new: true }
    );
    
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    res.json(journal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/journal/:id/summary
// @desc    Update journal summary
// @access  Private
router.put('/:id/summary', async (req, res) => {
  const { summary } = req.body;
  
  try {
    const journal = await Journal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { summary } },
      { new: true }
    );
    
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    res.json(journal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;