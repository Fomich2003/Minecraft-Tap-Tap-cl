import { useEffect, useState } from "react"
import TelegramAlert from "./components/TelegramAlert/TelegramAlert"
import userService from "./services/user.service"

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
    <>
      {
        initData ?
          <pre>{JSON.stringify(initData, null, 2)}</pre> :
          <TelegramAlert />
      }
    </>
  )
}

export default App