import TelegramAlert from "./components/TelegramAlert/TelegramAlert"
import NavBar from "./components/NavBar/NavBar"
import Home from "./pages/Home/Home"
import Profile from "./pages/Profile/Profile"
import Header from "./components/Header/Header"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { useState } from "react"
import { useUserContext } from "./context/UserContext"
import Tap from "./pages/Tap/Tap"
import Inventory from "./pages/Inventory/Inventory"
import Quests from "./pages/Quests/Quests"
import LanguageSheet from "./components/LanguageSheet/LanguageSheet"
import { t, useLanguage } from "./i18n"

function App() {
  const { user, isLoadingUser, profileError, reloadProfile } = useUserContext()
  const location = useLocation()
  const [languagesOpen, setLanguagesOpen] = useState(false)
  useLanguage()
  if (isLoadingUser) return <TelegramAlert title={t("Завантаження світу...")} loading />
  if (profileError) return <TelegramAlert title={t("Не вдалося відкрити гру")} message={profileError} onRetry={reloadProfile} />
  if (!user) return <TelegramAlert />
  return (
    <div className="App">

      <Header onOpenLanguages={() => setLanguagesOpen(true)} />

      <div className={`content${location.pathname === "/game" ? " content--game" : ""}${location.pathname === "/inventory" ? " content--inventory" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/game" element={<Tap />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <NavBar />

      <LanguageSheet open={languagesOpen} onClose={() => setLanguagesOpen(false)} />

    </div>
  )
}

export default App
