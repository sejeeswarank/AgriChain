import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log("%c Deployment Version: 1.0.2 - Vercel Fix Verification ", "background: #222; color: #bada55; padding: 4px; border-radius: 4px;");

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
