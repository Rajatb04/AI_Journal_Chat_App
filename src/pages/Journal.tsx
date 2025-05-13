import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Menu, LogOut, BookOpen, PenLine, Sparkles } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { format } from 'date-fns';

// Types
interface Message {
  _id?: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface JournalEntry {
  _id: string;
  user: string;
  date: Date;
  messages: Message[];
  summary: string;
  mood: string;
}

const quickPrompts = [
  { text: "Summarize my day", icon: <BookOpen size={14} /> },
  { text: "Give me motivation for tomorrow", icon: <Sparkles size={14} /> },
  { text: "What can I improve this week?", icon: <PenLine size={14} /> }
];

function Journal() {
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useContext(AuthContext);
  
  // Fetch today's journal on load
  useEffect(() => {
    const fetchTodayJournal = async () => {
      try {
        const res = await axios.get('/journal/today');
        setJournal(res.data);
      } catch (err) {
        console.error('Failed to fetch journal', err);
        setError('Failed to load your journal. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTodayJournal();
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [journal?.messages]);
  
  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return;
    
    // Add user message to UI immediately
    const userMessage: Message = {
      sender: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    setJournal(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, userMessage]
      };
    });
    
    setSending(true);
    setMessage('');
    
    try {
      // Send message to backend
      const msgRes = await axios.post('/journal/message', {
        content: content.trim()
      });
      
      // Get AI response
      const aiRes = await axios.post('/ai/response', {
        message: content.trim()
      });
      
      // Update journal with latest data including AI response
      setJournal(msgRes.data);
    } catch (err) {
      console.error('Failed to send message', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
  };
  
  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-full shadow-md"
      >
        <Menu size={24} />
      </button>
      
      {/* Sidebar */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-0 z-20 bg-black bg-opacity-50 md:bg-opacity-0 md:relative flex"
            onClick={() => setMenuOpen(false)}
          >
            <div 
              className="w-72 bg-white min-h-screen flex flex-col shadow-lg p-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-100 rounded-full">
                  <MessageSquare size={24} className="text-blue-600" />
                </div>
                <h1 className="text-xl font-bold">AI Journal</h1>
              </div>
              
              <nav className="flex-1">
                <Link
                  to="/journal"
                  className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 rounded-lg font-medium mb-2 bg-blue-50 text-blue-700"
                >
                  <PenLine size={20} />
                  Today's Journal
                </Link>
                
                <Link
                  to="/history"
                  className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 rounded-lg font-medium"
                >
                  <BookOpen size={20} />
                  Journal History
                </Link>
              </nav>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center gap-3 px-3 mb-5">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user?.username}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 md:px-8 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </h1>
          <p className="text-gray-600 mt-1">Your daily reflection space</p>
        </motion.div>
        
        {/* Messages Container */}
        <div className="flex-1 bg-white rounded-t-xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {journal?.messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.1 * index, 1) }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Quick Prompts */}
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  disabled={sending}
                  className="flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-full text-blue-700 text-sm font-medium transition-colors"
                >
                  {prompt.icon}
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>
          
          {/* Message Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            {error && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your thoughts here..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full p-3 transition"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Journal;

// Add the missing MessageSquare component
function MessageSquare({ size = 24, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}