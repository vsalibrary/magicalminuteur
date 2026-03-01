import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DisplayView } from './components/DisplayView.jsx'

const isDisplay = window.location.pathname === '/display'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDisplay ? <DisplayView /> : <App />}
  </StrictMode>,
)
