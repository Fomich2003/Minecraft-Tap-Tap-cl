import { createContext, useState, useEffect, useContext } from "react"
import userService from "../services/user.service"
import blockService from "../services/block.service"
import inventoryService from "../services/inventory.service"
import { CLIENT_CONF } from "../config/api.config"

const UserContext = createContext()

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null)

    const [userBlocks, setUserBlocks] = useState([])

    const [telegramData, setTelegramData] = useState(null)

    const [isLoadingUser, setIsLoading] = useState(true)

    const [inventory, setInventory] = useState(null)

    const [profileError, setProfileError] = useState(null)

    const loadProfile = async (raw) => {
        setIsLoading(true)
        setProfileError(null)

        const data = await userService.getProfile(raw)

        if (data.user) {
            setUser(data.user)
            setUserBlocks(data.user.tapBlocks)
            setInventory(data.inventory)
        } else {
            setProfileError(data.message || "Не вдалося завантажити профіль")
        }

        setIsLoading(false)
    }

    useEffect(() => {
        const raw = CLIENT_CONF.mode === "development" ? "test" : window.Telegram?.WebApp?.initData

        if (!raw) {
            setIsLoading(false)
            return
        }

        window.Telegram?.WebApp?.ready()
        setTelegramData(raw)
        loadProfile(raw)
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

    const buyBlock = async (slug) => {
        if (!telegramData) return { success: false, message: "telegramData is invalid" };

        const result = await blockService.buyBlock(telegramData, slug);

        if (result.block && result.user) {
            setUser(result.user);
            setUserBlocks(result.user.tapBlocks);
        }

        return result;
    };

    const craftItems = async (recipeId, items) => {
        const result = await inventoryService.craft(telegramData, recipeId, items)
        if (result.success && result.inventory) setInventory(result.inventory)
        return result
    }


    return (
        <UserContext.Provider value={{
            user,
            userBlocks,
            telegramData,
            isLoadingUser,
            profileError,
            reloadProfile: () => loadProfile(telegramData),
            setUser,
            handleClaimAward,
            getFirstBlock,
            sendTapsBlock,
            buyBlock,
            inventory,
            craftItems
        }}>
            {children}
        </UserContext.Provider>
    );
};

UserProvider.Context = UserContext
export const useUserContext = () => useContext(UserProvider.Context)
export default UserProvider
