import { useEffect, useState } from "react"
import TelegramAlert from "./components/TelegramAlert/TelegramAlert"
import userService from "./services/user.service"
import NavBar from "./components/NavBar/NavBar"
import Home from "./pages/Home/Home"
import Profile from "./pages/Profile/Profile"
import Header from "./components/Header/Header"
import { BrowserRouter, Route, Routes } from "react-router-dom"

function App() {
  const [initData, setInitData] = useState(null)

  useEffect(() => {
    if (window?.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp

      tg.ready()

      const raw = tg.initData

      if (raw) {
        const parsed = Object.fromEntries(new URLSearchParams(raw))
        userService.getProfile().then((data) => {
          setInitData({ parsed, data })
        })
        console.log(parsed)
      } else {
        console.log("initData пустий")
      }
    } else {
      console.log("Telegram WebApp не знайдено")
    }
  }, [])

  return (
    <div className="App">
    
      <Header />

      <div className="content">
        <Routes>
          <Route path="/" element={<Home data={initData} />} />
          <Route path="profile" element={<Profile />} />
        </Routes>
      </div>

      <NavBar />

    </div>
  )
}

export default App