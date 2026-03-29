import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const isDisplay = window.location.pathname === '/display'

const App = lazy(() => import('./App.jsx'))
const DisplayView = lazy(() => import('./components/DisplayView.jsx').then(m => ({ default: m.DisplayView })))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      {isDisplay ? <DisplayView /> : <App />}
    </Suspense>
  </StrictMode>,
)
