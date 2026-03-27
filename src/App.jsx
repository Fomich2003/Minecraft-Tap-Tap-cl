import { useEffect, useState } from "react"

function App() {
  const [initData, setInitData] = useState(null)
  useEffect(() => {
    if (window) {
      console.log(window)
      console.log(window.Telegram.WebApp)
      setInitData(JSON.stringify(window.Telegram.WebApp.initData, null, 2))
    }
  }, [])
  return (
    <>
      {initData && initData}
    </>
  )
}

export default App
