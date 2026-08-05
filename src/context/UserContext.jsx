import { createContext, useState, useEffect, useContext } from "react";
import userService from "../services/user.service";
import blockService from "../services/block.service";
import { CLIENT_CONF } from "../config/api.config";
import { data } from "react-router-dom";

const UserContext = createContext();

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const [userBlocks, setUserBlocks] = useState([]);

    const [telegramData, setTelegramData] = useState(null);

    const [isLoadingUser, setIsLoading] = useState(true);


    useEffect(() => {
        if (CLIENT_CONF.mode === "development") {
            setTelegramData("test")
            userService.getProfile().then((data) => {
                setUser(data.user)
                setUserBlocks(data.user.tapBlocks)
            })
            setIsLoading(false)

            return
        }

        if (window?.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp

            tg.ready()

            const raw = tg.initData

            if (raw) {
                setTelegramData(raw)
                userService.getProfile(raw).then((data) => {
                    setUser(data.user)
                    setUserBlocks(data.user.tapBlocks)
                })
                setIsLoading(false)
            } else {
                console.log("initData пустий")
            }
        } else {
            console.log("Telegram WebApp не знайдено")
        }

    }, [])

    const handleClaimAward = async () => {
        if (!telegramData) return { success: false, message: "telegramData is invalid" }

        const result = await userService.claimAward(telegramData)
        if (result.user) setUser(prev => ({
            ...prev,
            lastAwardTime: result.user.lastAwardTime,
            balance: result.user.balance
        }))
        return result
    };


    const getFirstBlock = async () => {
        if (!telegramData) return { success: false, message: "telegramData is invalid" }

        const result = await blockService.getFirstBlock(telegramData)

        if (result.block) setUserBlocks(prev => ([
            ...prev,
            result.block
        ]))

        return result
    };

    const sendTapsBlock = async (slug, count) => {
        if (!telegramData) return { success: false, message: "telegramData is invalid" }

        const result = await blockService.sendTapsBlock(telegramData, slug, count)
        if (result.user) setUser(prev => ({
            ...prev,
            balance: result.user.balance
        }))
        return result
    };


    return (
        <UserContext.Provider value={{
            user,
            userBlocks,
            telegramData,
            isLoadingUser,
            setUser,
            handleClaimAward,
            getFirstBlock,
            sendTapsBlock
        }}>
            {children}
        </UserContext.Provider>
    );
};

UserProvider.Context = UserContext
export const useUserContext = () => useContext(UserProvider.Context)
export default UserProvider