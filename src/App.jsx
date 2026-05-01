import { useEffect, useState } from "react"
import TelegramAlert from "./components/TelegramAlert/TelegramAlert"
import NavBar from "./components/NavBar/NavBar"
import Home from "./pages/Home/Home"
import Profile from "./pages/Profile/Profile"
import Header from "./components/Header/Header"
import { BrowserRouter, Route, Routes } from "react-router-dom"

function App() {

  return (
    <div className="App">
    
      <Header />

      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="profile" element={<Profile />} />
        </Routes>
      </div>

      <NavBar />

    </div>
  )
}

export default App