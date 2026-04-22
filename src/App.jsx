import { useEffect, useState } from "react"
import TelegramAlert from "./components/TelegramAlert/TelegramAlert"
import userService from "./services/user.service"
import NavBar from "./components/NavBar/NavBar"

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
          setInitData({parsed, data})
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
      {/* {
        initData ?
          <pre>{JSON.stringify(initData, null, 2)}</pre> :
          <TelegramAlert />
      }  */}
      <NavBar />
    </div>
  )
}

export default App