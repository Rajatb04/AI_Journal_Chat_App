import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Journal from '../models/Journal.js';
import { startOfDay, endOfDay } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// async function listModels() {
//   try {
//     // The correct way to list models using the REST API
//     const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
//       headers: {
//         'x-goog-api-key': process.env.GEMINI_API_KEY
//       }
//     });
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }
    
//     const data = await response.json();
//     console.log("Available models:", data);
//     return data;
//   } catch (error) {
//     console.error("Error listing models:", error);
//     throw error;
//   }
// }

// listModels();

// Helper function to get model
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

// @route   POST api/ai/response
// @desc    Get AI response to user message
// @access  Private
router.post('/response', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    const today = new Date();
    
    // Find today's journal
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
    
    // Format conversation history for Gemini
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
    
    journal.messages.push({
      sender: 'ai',
      content: aiResponse
    });
    
    await journal.save();
    
    res.json({ response: aiResponse });
  } catch (err) {
    console.error('AI response error:', err);
    res.status(500).json({ message: 'Failed to get AI response', error: err.message });
  }
});

// @route   POST api/ai/summarize
// @desc    Generate a summary of today's journal
// @access  Private
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