import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth as useClerkAuth, UserButton, SignInButton } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function Navbar() {
  const { isSignedIn } = useClerkAuth();
  const { user } = useAuth(); // MongoDB profile — for _id, name, etc.
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/70 backdrop-blur-xl border-b border-white/5 shadow-2xl">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="font-head font-extrabold text-xl tracking-tight group">
          Task<span className="gradient-text">Mate</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/browse" className={`text-sm font-medium transition-colors ${isActive('/browse') ? 'text-accent' : 'text-[#888] hover:text-white'}`}>
            Browse Tasks
          </Link>
          {isSignedIn && (
            <Link to="/dashboard" className={`text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-accent' : 'text-[#888] hover:text-white'}`}>
              Dashboard
            </Link>
          )}
          {isSignedIn && user?.isAdmin && (
            <Link to="/admin" className={`text-sm font-medium transition-colors flex items-center gap-1 ${isActive('/admin') ? 'text-accent' : 'text-[#888] hover:text-white'}`}>
              <Shield className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/post"
                  className="glow-accent bg-accent text-black text-sm font-bold px-4 py-2 rounded-lg hover:opacity-95 transition-all"
                >
                  + Post Task
                </Link>
              </motion.div>

              {/* Profile link — uses MongoDB _id */}
              {user && (
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    to={`/profile/${user._id}`}
                    className="text-sm text-[#888] hover:text-white transition-colors px-3 py-2 border border-[#222] rounded-lg hover:border-accent"
                  >
                    My Profile
                  </Link>
                </motion.div>
              )}

              {/* Clerk's built-in avatar + sign-out dropdown */}
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  variables: { colorPrimary: '#f5a623' },
                  elements: {
                    avatarBox: 'w-8 h-8 ring-2 ring-accent/30 hover:ring-accent/70 transition-all',
                    userButtonPopoverCard: 'bg-[#161616] border border-[#222]',
                    userButtonPopoverActionButton: 'text-[#ccc] hover:bg-[#1e1e1e]',
                  },
                }}
              />
            </>
          ) : (
            <>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/login"
                  className="text-sm text-[#888] hover:text-white transition-colors px-4 py-2 border border-[#222] rounded-lg hover:border-accent"
                >
                  Log in
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/register"
                  className="glow-accent bg-accent text-black text-sm font-bold px-4 py-2 rounded-lg hover:opacity-95 transition-all"
                >
                  Get Started
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-[#888] hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#111] border-t border-[#222] px-6 py-4 flex flex-col gap-4">
          <Link to="/browse" className="text-sm text-[#ccc]" onClick={() => setMenuOpen(false)}>Browse Tasks</Link>
          {isSignedIn ? (
            <>
              <Link to="/post" className="text-sm text-[#ccc]" onClick={() => setMenuOpen(false)}>Post a Task</Link>
              <Link to="/dashboard" className="text-sm text-[#ccc]" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              {user?.isAdmin && (
                <Link to="/admin" className="text-sm text-[#ccc] flex items-center gap-1" onClick={() => setMenuOpen(false)}><Shield className="w-3.5 h-3.5" /> Admin</Link>
              )}
              {user && (
                <Link to={`/profile/${user._id}`} className="text-sm text-[#ccc]" onClick={() => setMenuOpen(false)}>Profile</Link>
              )}
              <div className="pt-1 border-t border-[#222]">
                <UserButton afterSignOutUrl="/" appearance={{ variables: { colorPrimary: '#f5a623' } }} />
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-[#ccc]" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link to="/register" className="text-sm text-accent font-bold" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
