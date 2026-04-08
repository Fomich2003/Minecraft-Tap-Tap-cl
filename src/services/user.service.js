import smartFetch from "../utils/smartFetch"

class UserService {

   async getProfile() {
     return await smartFetch("/user/profile")
   }


}

const userService = new UserService()

export default userService