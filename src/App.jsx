import TelegramAlert from "./components/TelegramAlert/TelegramAlert"
import NavBar from "./components/NavBar/NavBar"
import Home from "./pages/Home/Home"
import Profile from "./pages/Profile/Profile"
import Header from "./components/Header/Header"
import { Route, Routes, useLocation } from "react-router-dom"
import { useUserContext } from "./context/UserContext"
import Tap from "./pages/Tap/Tap"
import Inventory from "./pages/Inventory/Inventory"

function App() {
  const { user, isLoadingUser, profileError, reloadProfile } = useUserContext()
  const location = useLocation()
  if (isLoadingUser) return <TelegramAlert title="Завантаження..." />
  if (profileError) return <TelegramAlert title="Не вдалося відкрити гру" message={profileError} onRetry={reloadProfile} />
  if (!user) return <TelegramAlert />
  return (
    <div className="App">

      <Header />

      <div className={`content${location.pathname === "/game" ? " content--game" : ""}${location.pathname === "/inventory" ? " content--inventory" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/game" element={<Tap />} />
          <Route path="/inventory" element={<Inventory />} />
        </Routes>
      </div>

      <NavBar />

    </div>
  )
}

export default App
