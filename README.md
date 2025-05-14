# AI-Powered Journal Chat App

A conversational journaling application built with the MERN stack and integrated with Google's Gemini AI to provide an engaging and reflective journaling experience.

## Features

- User authentication system with JWT
- Interactive chat interface for natural journaling
- AI-powered responses via Gemini API
- Persistent chat history in MongoDB
- Daily journal entries with AI-assisted reflection
- Quick journaling prompts for guided reflection
- Journal history organized by date

## Tech Stack

- **MongoDB**: Database for storing user data and journal entries
- **Express.js**: Backend API framework
- **React.js**: Frontend UI built with Vite
- **Node.js**: Server runtime
- **Gemini API**: AI-powered conversational responses
- **JWT**: Authentication
- **TailwindCSS**: Styling
- **Framer Motion**: Animations

## Getting Started

### Prerequisites

- Node.js and npm installed
- MongoDB installed locally or MongoDB Atlas account
- Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Start the development server:
   ```
   npm run dev:all
   ```

## Project Structure

- `/server`: Express backend
  - `/models`: MongoDB schemas
  - `/routes`: API endpoints
  - `/middleware`: Authentication middleware
- `/src`: React frontend
  - `/context`: React context for global state
  - `/pages`: Main application pages
  - `/components`: Reusable UI components
