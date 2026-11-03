import TelegramAlert from "./components/TelegramAlert/TelegramAlert"
import NavBar from "./components/NavBar/NavBar"
import Home from "./pages/Home/Home"
import Profile from "./pages/Profile/Profile"
import Header from "./components/Header/Header"
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { showBackButton } from "./utils/telegram"
import { useUserContext } from "./context/UserContext"
import Tap from "./pages/Tap/Tap"
import Inventory from "./pages/Inventory/Inventory"
import Quests from "./pages/Quests/Quests"
import Top from "./pages/Top/Top"
import Cards from "./pages/Cards/Cards"
import LanguageSheet from "./components/LanguageSheet/LanguageSheet"
import { t, useLanguage } from "./i18n"

function App() {
  const { user, isLoadingUser, profileError, reloadProfile } = useUserContext()
  const location = useLocation()
  const navigate = useNavigate()
  const [languagesOpen, setLanguagesOpen] = useState(false)
  useLanguage()

  // Кнопка «Назад» Telegram на всіх сторінках, крім головної. Якщо гравець відкрив гру одразу
  // на внутрішній сторінці, історії немає, тоді кнопка веде на головну, а не закриває застосунок
  const isHome = location.pathname === "/"
  // Лише факт входу: баланс змінюється на кожен тап, і кнопка не має блимати
  const signedIn = Boolean(user)
  useEffect(() => {
    if (isHome || !signedIn) return
    return showBackButton(() => {
      if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
      else navigate("/", { replace: true })
    })
  }, [isHome, signedIn, navigate])
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
          <Route path="/cards" element={<Cards />} />
          <Route path="/top" element={<Top />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <NavBar />

      <LanguageSheet open={languagesOpen} onClose={() => setLanguagesOpen(false)} />

    </div>
  )
}

export default App
