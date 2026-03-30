import { useEffect, useState } from "react"

function App() {
  const [initData, setInitData] = useState(null)
  useEffect(() => {
    if (window?.Telegram?.WebApp) {
      const raw = window.Telegram.WebApp.initData;

      const parsed = Object.fromEntries(new URLSearchParams(raw));

      console.log(parsed);

      setInitData(parsed);
    }
  }, [window]);
  return (
    <>
      {initData}
    </>
  )
}

export default App
