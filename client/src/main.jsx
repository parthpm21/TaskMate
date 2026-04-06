import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
