import { createContext, useState, useEffect, useContext } from "react"
import userService from "../services/user.service"
import blockService from "../services/block.service"
import inventoryService from "../services/inventory.service"
import stationService from "../services/station.service"
import questService from "../services/quest.service"
import mobService from "../services/mob.service"
import { CLIENT_CONF } from "../config/api.config"
import { setupTelegram } from "../utils/telegram"
import { changeLanguage, hasChosenLanguage, t } from "../i18n"

const UserContext = createContext()

const NO_ACCOUNT = "Не вдалося підтвердити акаунт Telegram"
const MOB_PREFIX = "mob_"

// Якщо скрипт Telegram не завантажився, ті самі підписані дані лишаються в адресі. Поза Telegram їх немає
const telegramInitData = () => window.Telegram?.WebApp?.initData || new URLSearchParams(window.location.hash.slice(1)).get("tgWebAppData")
const readInitData = () => (CLIENT_CONF.mode === "development" ? "test" : telegramInitData()) || null

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
            // Мова з іншого пристрою: локальний вибір завжди важливіший
            if (data.user.language && !hasChosenLanguage()) await changeLanguage(data.user.language).catch(error => console.warn(error.message))
            setUser(data.user)
            setUserBlocks(data.user.tapBlocks)
            setInventory(data.inventory)
            if (catalogData.success) setCatalog(catalogData)
            // Новий користувач створюється запитом профілю, тому верстаки читаються після нього
            const stationList = stationData.success ? stationData : await stationService.list(raw)
            if (stationList.success) setStations(stationList.stations)
        } else {
            setProfileError(data.message || t("Не вдалося завантажити профіль"))
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
        setupTelegram()
        // eslint-disable-next-line react-hooks/set-state-in-effect -- результат запиту до сервера
        loadProfile(telegramData)
    }, [telegramData])

    // Повертає клієнт до стану сервера, якщо він відхилив оптимістичні зміни
    const syncProfile = async () => {
        const data = await userService.getProfile(telegramData)
        if (!data.user) return
        setUser(data.user)
        setUserBlocks(data.user.tapBlocks)
        setInventory(data.inventory)
    }

    // Відповіді сервера повертають змінені інвентар і баланс
    const applyResult = result => {
        if (result.inventory) setInventory(result.inventory)
        if (typeof result.balance === "number") setUser(prev => ({ ...prev, balance: result.balance }))
        if (result.stations) setStations(result.stations)
        if (result.loadout) setUser(prev => ({ ...prev, loadout: result.loadout }))
        if (typeof result.questsReady === "number") setUser(prev => ({ ...prev, questsReady: result.questsReady }))
        if (typeof result.bookshelves === "number") setUser(prev => ({ ...prev, bookshelves: result.bookshelves }))
        if (result.knowledge) setUser(prev => ({ ...prev, knowledge: true }))
        if (result.profileBanner) setUser(prev => ({ ...prev, profileBanner: result.profileBanner }))
        if (result.experience) setUser(prev => ({ ...prev, loadout: { ...prev.loadout, experience: result.experience } }))
        return result
    }

    const handleClaimAward = async () => {
        if (!telegramData) return { success: false, message: t(NO_ACCOUNT) }

        const result = await userService.claimAward(telegramData)
        if (result.user) setUser(prev => ({
            ...prev,
            lastAwardTime: result.user.lastAwardTime,
            balance: result.user.balance
        }))
        if (result.inventory) setInventory(result.inventory)
        return result
    };


    const getFirstBlock = async () => {
        if (!telegramData) return { success: false, message: t(NO_ACCOUNT) }

        const result = await blockService.getFirstBlock(telegramData)

        if (result.block) setUserBlocks(prev => ([
            ...prev,
            result.block
        ]))

        return result
    };

    const sendTapsBlock = async (slug, count) => {
        if (!telegramData) return { success: false, message: t(NO_ACCOUNT) }

        // Черга тапів одна на все: моби відрізняються лише префіксом ключа
        const result = slug.startsWith(MOB_PREFIX)
            ? await mobService.hit(telegramData, slug.slice(MOB_PREFIX.length), count)
            : await blockService.sendTapsBlock(telegramData, slug, count)
        if (result.inventory) setInventory(result.inventory)
        return result
    };

    const buyBlock = async (slug) => {
        if (!telegramData) return { success: false, message: t(NO_ACCOUNT) };

        const result = await blockService.buyBlock(telegramData, slug);

        if (result.block && result.user) {
            setUser(result.user);
            setUserBlocks(result.user.tapBlocks);
        }

        return result;
    };

    const upgradeTap = async () => {
        if (!telegramData) return { success: false, message: t(NO_ACCOUNT) }

        const result = await userService.upgradeTap(telegramData)
        if (result.success) setUser(prev => ({ ...prev, balance: result.balance, upgrade: result.upgrade, loadout: result.loadout }))
        return result
    }

    const buyItem = async (slug, quantity, variant) => applyResult(await inventoryService.buy(telegramData, slug, quantity, variant))

    const sellStack = async (stackId, quantity) => applyResult(await inventoryService.sell(telegramData, stackId, quantity))

    const buyStation = async slug => applyResult(await stationService.buy(telegramData, slug))

    const activateStation = async slug => applyResult(await stationService.activate(telegramData, slug))

    const loadEquipment = async () => applyResult(await userService.equipment(telegramData))

    const equipTool = async (stackId, kind) => applyResult(await userService.equip(telegramData, stackId, kind))

    const consumeItem = async stackId => applyResult(await userService.consume(telegramData, stackId))

    const installBookshelves = async () => applyResult(await stationService.installBookshelves(telegramData))

    const loadRecipes = () => stationService.recipes(telegramData)

    const hangBanner = async stackId => applyResult(await userService.hangBanner(telegramData, stackId))

    const loadMobs = () => mobService.list(telegramData)

    const buyMob = async slug => applyResult(await mobService.buy(telegramData, slug))

    const summonBoss = slug => mobService.summon(telegramData, slug)

    const mergeStacks = async (fromId, toId) => applyResult(await inventoryService.merge(telegramData, fromId, toId))

    const compactStacks = async () => applyResult(await inventoryService.compact(telegramData))

    const recycleStack = async (stackId, quantity) => applyResult(await inventoryService.recycle(telegramData, stackId, quantity))

    const loadQuests = async () => applyResult(await questService.list(telegramData))

    const claimQuest = async id => applyResult(await questService.claim(telegramData, id))

    const saveLanguage = code => userService.setLanguage(telegramData, code)

    const loadLeaderboard = metric => userService.leaderboard(telegramData, metric)

    return (
        <UserContext.Provider value={{
            user,
            userBlocks,
            telegramData,
            isLoadingUser,
            profileError,
            reloadProfile: retryProfile,
            syncProfile,
            setUser,
            handleClaimAward,
            getFirstBlock,
            sendTapsBlock,
            buyBlock,
            upgradeTap,
            inventory,
            catalog,
            stations,
            applyResult,
            buyItem,
            sellStack,
            buyStation,
            activateStation,
            loadEquipment,
            equipTool,
            consumeItem,
            installBookshelves,
            loadRecipes,
            hangBanner,
            loadMobs,
            buyMob,
            summonBoss,
            mergeStacks,
            compactStacks,
            recycleStack,
            loadQuests,
            claimQuest,
            saveLanguage,
            loadLeaderboard
        }}>
            {children}
        </UserContext.Provider>
    );
};

UserProvider.Context = UserContext
// eslint-disable-next-line react-refresh/only-export-components -- хук навмисно живе поруч із провайдером
export const useUserContext = () => useContext(UserProvider.Context)
export default UserProvider
