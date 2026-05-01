import { createContext, useState, useEffect, useContext } from "react";
import userService from "../services/user.service";

const UserContext = createContext();

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [telegramData, setTelegramData] = useState(null);
    const [isLoadingUser, setIsLoading] = useState(true);

    useEffect(() => {

        if (window?.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp

            tg.ready()

            const raw = tg.initData

            if (raw) {
                const parsed = Object.fromEntries(new URLSearchParams(raw))
                setTelegramData(JSON.parse(parsed.user))
                userService.getProfile().then((data) => {
                    setUser(data.user)
                })
                setIsLoading(false)
            } else {
                console.log("initData пустий")
            }
        } else {
            console.log("Telegram WebApp не знайдено")
        }

    }, [])

    return (
        <UserContext.Provider value={{ user, telegramData, isLoadingUser, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

UserProvider.Context = UserContext
export const useUserContext = () => useContext(UserProvider.Context)
export default UserProvider