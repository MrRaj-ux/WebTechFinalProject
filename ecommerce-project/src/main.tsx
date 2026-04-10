import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router';
import axios from 'axios';
import './index.css'
import App from './App.tsx'

axios.defaults.baseURL = 'https://webtechfinalproject-t3xz.onrender.com';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
