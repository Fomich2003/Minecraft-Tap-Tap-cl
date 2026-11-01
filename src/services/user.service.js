import smartFetch from "../utils/smartFetch"

class UserService {

  async getProfile(telegramData) {
    return await smartFetch("/user/profile", {
      body: JSON.stringify({telegramData}),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
  }


  async claimAward(telegramData) {
    return await smartFetch("/user/claim-award", {
      body: JSON.stringify({telegramData}),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
  }

  async upgradeTap(telegramData) {
    return await smartFetch("/user/upgrade", {
      body: JSON.stringify({telegramData}),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
  }

  async equipment(telegramData) {
    return await this.post("/user/equipment", { telegramData })
  }

  async equip(telegramData, stackId, kind) {
    return await this.post("/user/equip", { telegramData, stackId, kind })
  }

  async consume(telegramData, stackId) {
    return await this.post("/user/consume", { telegramData, stackId })
  }

  async hangBanner(telegramData, stackId) {
    return await this.post("/user/banner", { telegramData, stackId });
  }

  async setLanguage(telegramData, language) {
    return await this.post("/user/language", { telegramData, language })
  }

  async leaderboard(telegramData, metric) {
    return await this.post("/user/leaderboard", { telegramData, metric })
  }

  post(path, body) {
    return smartFetch(path, {
      body: JSON.stringify(body),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
  }

}

const userService = new UserService()

export default userService