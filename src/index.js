import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// The import name might be different if you renamed App to AppWithAuth in App.js
import AppWithAuth from './App'; 
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWithAuth />
  </React.StrictMode>
);

reportWebVitals();