import React from 'react';
import ReactDOM from 'react-dom/client';

// import App from './App';
import Commonjs from './commonApp';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Redirect all Axios requests to local server when running in development (on localhost)
axios.interceptors.request.use(
  (config) => {
    if (window.location.hostname === "localhost" && config.url) {
      if (config.url.includes("http://localhost:3000")) {
        config.url = config.url.replace("http://localhost:3000", "http://localhost:8080");
      } else if (config.url.includes("http://localhost:3000")) {
        config.url = config.url.replace("http://localhost:3000", "http://localhost:8080");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


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
