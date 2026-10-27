import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import App from './App';
import './index.css';

// Fix Windows flag emojis (renders Indian & country flags as real flags instead of 'IN', 'US', etc.)
polyfillCountryFlagEmojis();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
