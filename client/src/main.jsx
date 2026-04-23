import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in client/.env');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl="/login"
      signUpUrl="/register"
      afterSignInUrl="/browse"
      afterSignUpUrl="/browse"
      afterSignOutUrl="/"
    >
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#161616',
              color: '#f0ece4',
              border: '1px solid #2a2a2a',
              borderRadius: '14px',
              fontSize: '13.5px',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.01em',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,166,35,0.08)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#f5a623', secondary: '#0a0a0a' },
              style: {
                background: '#161616',
                border: '1px solid rgba(245,166,35,0.25)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(245,166,35,0.1)',
              },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0a0a0a' },
              style: {
                background: '#161616',
                border: '1px solid rgba(248,113,113,0.25)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(248,113,113,0.1)',
              },
            },
          }}
        />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
