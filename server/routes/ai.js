import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Journal from '../models/Journal.js';
import { startOfDay, endOfDay } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });
};

const SYSTEM_PROMPT = `You are an empathetic AI journal assistant. Your job is to have a supportive conversation with the user about their day, helping them reflect on their experiences, emotions, and thoughts. 

Follow these guidelines:
- Be warm, compassionate, and non-judgmental
- Ask thoughtful follow-up questions to help users explore their thoughts
- Provide encouraging and supportive responses
- Avoid giving generic advice unless specifically asked
- Focus on helping the user process their feelings and experiences
- Keep responses concise (2-3 sentences) and conversational

If the user wants specific guidance, they can use these commands:
- "Summarize my day" - Create a thoughtful summary based on the conversation
- "Give me motivation for tomorrow" - Provide personalized motivation
- "What can I improve this week?" - Offer gentle suggestions for growth

Remember that you're having a conversation to help someone journal about their day.`;

const SENTIMENT_PROMPT = `Analyze the following journal entry and determine the user's primary mood. Choose one of these moods: happy, neutral, sad, anxious, excited, tired, stressed, calm.

Only respond with a single word from the above list. Base your analysis on the overall tone and content of the messages.

Journal entry:`;

router.post('/response', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    const today = new Date();
    
    let journal = await Journal.findOne({
      user: req.user.id,
      date: {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      }
    });
    
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found for today' });
    }
    
    const chatHistory = journal.messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    const model = getGeminiModel();
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
      systemInstruction: SYSTEM_PROMPT,
    });
    
    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();
    
    // Analyze sentiment after every 3 user messages
    if (journal.messages.filter(m => m.sender === 'user').length % 3 === 0) {
      const conversationText = journal.messages
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');
      
      const sentimentResult = await model.generateContent(SENTIMENT_PROMPT + '\n' + conversationText);
      const mood = sentimentResult.response.text().toLowerCase().trim();
      
      if (['happy', 'neutral', 'sad', 'anxious', 'excited', 'tired', 'stressed', 'calm'].includes(mood)) {
        journal.mood = mood;
      }
    }
    
    journal.messages.push({
      sender: 'ai',
      content: aiResponse
    });
    
    await journal.save();
    
    res.json({ response: aiResponse, mood: journal.mood });
  } catch (err) {
    console.error('AI response error:', err);
    res.status(500).json({ message: 'Failed to get AI response', error: err.message });
  }
});

router.post('/summarize', async (req, res) => {
  try {
    const today = new Date();
    
    const journal = await Journal.findOne({
      user: req.user.id,
      date: {
        $gte: startOfDay(today),
        $lte: endOfDay(today)
      }
    });
    
    if (!journal || journal.messages.length < 3) {
      return res.status(400).json({ 
        message: 'Not enough journal content to generate a summary' 
      });
    }
    
    const conversationText = journal.messages
      .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n\n');
    
    const summaryPrompt = `Based on this journal conversation, create a thoughtful 2-3 sentence summary of the user's day that highlights key themes, emotions, and insights:\n\n${conversationText}`;
    
    const model = getGeminiModel();
    const result = await model.generateContent(summaryPrompt);
    const summary = result.response.text();
    
    journal.summary = summary;
    await journal.save();
    
    res.json({ summary });
  } catch (err) {
    console.error('Summary generation error:', err);
    res.status(500).json({ message: 'Failed to generate summary', error: err.message });
  }
});

export default router;