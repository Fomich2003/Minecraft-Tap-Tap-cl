import { useEffect } from "react"

function App() {
  useEffect(() => {
    if (window) {
      console.log(window)
      console.log(window.Telegram.WebApp)
    }
  }, [])
  return (
    <>

    </>
  )
}

export default App
