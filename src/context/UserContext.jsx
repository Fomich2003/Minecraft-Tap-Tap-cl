import { createContext, useState, useEffect, useContext } from "react"
import userService from "../services/user.service"
import blockService from "../services/block.service"
import inventoryService from "../services/inventory.service"
import stationService from "../services/station.service"
import { CLIENT_CONF } from "../config/api.config"

const UserContext = createContext()

const readInitData = () => (CLIENT_CONF.mode === "development" ? "test" : window.Telegram?.WebApp?.initData) || null

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null)

    const [userBlocks, setUserBlocks] = useState([])

    const [telegramData] = useState(readInitData)

    const [isLoadingUser, setIsLoading] = useState(Boolean(telegramData))

    const [inventory, setInventory] = useState(null)

    const [profileError, setProfileError] = useState(null)

    const [catalog, setCatalog] = useState(null)

    const [stations, setStations] = useState([])

    const loadProfile = async (raw) => {
        const [data, catalogData, stationData] = await Promise.all([
            userService.getProfile(raw),
            inventoryService.getCatalog(),
            stationService.list(raw),
        ])

        if (data.user) {
            setUser(data.user)
            setUserBlocks(data.user.tapBlocks)
            setInventory(data.inventory)
            if (catalogData.success) setCatalog(catalogData)
            // Новий користувач створюється запитом профілю, тому верстаки читаються після нього
            const stationList = stationData.success ? stationData : await stationService.list(raw)
            if (stationList.success) setStations(stationList.stations)
        } else {
            setProfileError(data.message || "Не вдалося завантажити профіль")
        }

        setIsLoading(false)
    }

    const retryProfile = () => {
        setIsLoading(true)
        setProfileError(null)
        loadProfile(telegramData)
    }

    useEffect(() => {
        if (!telegramData) return
        window.Telegram?.WebApp?.ready()
        // eslint-disable-next-line react-hooks/set-state-in-effect -- результат запиту до сервера
        loadProfile(telegramData)
    }, [telegramData])

    // Відповіді сервера повертають змінені інвентар і баланс
    const applyResult = result => {
        if (result.inventory) setInventory(result.inventory)
        if (typeof result.balance === "number") setUser(prev => ({ ...prev, balance: result.balance }))
        if (result.stations) setStations(result.stations)
        return result
    }

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
        if (result.inventory) setInventory(result.inventory)
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

    const buyItem = async (slug, quantity) => applyResult(await inventoryService.buy(telegramData, slug, quantity))

    const sellStack = async (stackId, quantity) => applyResult(await inventoryService.sell(telegramData, stackId, quantity))

    const buyStation = async slug => applyResult(await stationService.buy(telegramData, slug))

    const activateStation = async slug => applyResult(await stationService.activate(telegramData, slug))


    return (
        <UserContext.Provider value={{
            user,
            userBlocks,
            telegramData,
            isLoadingUser,
            profileError,
            reloadProfile: retryProfile,
            setUser,
            handleClaimAward,
            getFirstBlock,
            sendTapsBlock,
            buyBlock,
            inventory,
            catalog,
            stations,
            applyResult,
            buyItem,
            sellStack,
            buyStation,
            activateStation
        }}>
            {children}
        </UserContext.Provider>
    );
};

UserProvider.Context = UserContext
export const useUserContext = () => useContext(UserProvider.Context)
export default UserProvider
