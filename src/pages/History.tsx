import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Menu, BookOpen, PenLine, Calendar } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';


interface JournalSummary {
  _id: string;
  date: string;
  summary: string;
  mood: string;
}

function History() {
  const [journals, setJournals] = useState<JournalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  
  const { user, logout } = useContext(AuthContext);
  
  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const res = await axios.get('/journal');
        setJournals(res.data);
      } catch (err) {
        console.error('Failed to fetch journals', err);
        setError('Failed to load your journal history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJournals();
  }, []);
  
  const groupedJournals = journals.reduce((groups, journal) => {
    const date = parseISO(journal.date);
    const monthYear = format(date, 'MMMM yyyy');
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(journal);
    return groups;
  }, {} as Record<string, JournalSummary[]>);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-full shadow-md"
      >
        <Menu size={24} />
      </button>
      <motion.div
        initial={{ x: menuOpen ? 0 : -300 }}
        animate={{ x: menuOpen ? 0 : -300 }}
        className="fixed inset-0 z-20 bg-black bg-opacity-50 md:bg-opacity-0 md:relative md:translate-x-0 flex"
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
              className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 rounded-lg font-medium mb-2"
            >
              <PenLine size={20} />
              Today's Journal
            </Link>
            
            <Link
              to="/history"
              className="flex items-center gap-3 p-3 text-gray-700 bg-blue-50 text-blue-700 rounded-lg font-medium"
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
      
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-6">

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Journal History</h1>
          <p className="text-gray-600 mt-1">View and revisit your past reflections</p>
        </motion.div>
        

        <div className="bg-white rounded-xl shadow-sm p-6">
          {error && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 p-4 rounded-lg">
              {error}
            </div>
          )}
          
          {journals.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No journal entries yet</p>
              <p className="text-gray-500 mb-6">Start journaling today to see your history here</p>
              <Link
                to="/journal"
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                <PenLine size={18} />
                Create your first entry
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedJournals).map(([monthYear, monthJournals]) => (
                <div key={monthYear}>
                  <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Calendar size={16} />
                    {monthYear}
                  </h2>
                  
                  <div className="space-y-3">
                    {monthJournals.map((journal) => (
                      <motion.div
                        key={journal._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.005 }}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-800">
                            {format(parseISO(journal.date), 'EEEE, MMMM d, yyyy')}
                          </h3>
                          
                          {journal.mood && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              {journal.mood}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {journal.summary || "No summary available"}
                        </p>
                        
                        <Link
                          to={`/journal/${journal._id}`}
                          className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View entry
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;

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