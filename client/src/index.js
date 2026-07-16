import React from 'react';
import ReactDOM from 'react-dom/client';

// import App from './App';
import Commonjs from './commonApp';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

window.API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8080"
  : (process.env.REACT_APP_API_URL || "https://sf.doaguru.com");


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Commonjs />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// Register Service Worker for background notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(registration => {
      console.log('✅ Service Worker registered with scope:', registration.scope);
    }).catch(error => {
      console.error('❌ Service Worker registration failed:', error);
    });
  });
}

reportWebVitals();
