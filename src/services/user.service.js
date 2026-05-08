import smartFetch from "../utils/smartFetch"

class UserService {

  async getProfile(telegramData) {
    return await smartFetch("/user/profile", {
      body: JSON.stringify(telegramData),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
  }


}

const userService = new UserService()

export default userService