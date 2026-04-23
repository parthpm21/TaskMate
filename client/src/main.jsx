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
            style: {
              background: '#161616',
              color: '#f0ece4',
              border: '1px solid #222',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#f5a623', secondary: '#000' } },
          }}
        />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
