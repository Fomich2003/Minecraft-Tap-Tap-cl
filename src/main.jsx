import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import UserProvider from './context/UserContext.jsx'
import './index.scss'
import App from './App.jsx'
import { initLanguage } from './i18n'

// Обрана мова вантажиться до першого малювання, інакше гравець побачить спалах української
initLanguage().finally(() => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </StrictMode>

))
