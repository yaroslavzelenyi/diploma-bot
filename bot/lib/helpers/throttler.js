module.exports = function throttler(waitTime) {
    const users = new Map()
    return (chatId) => {
       const now = parseInt(Date.now()/1000)
       const hitTime = users.get(chatId)
       if (hitTime) {
         const diff = now - hitTime
         if (diff < waitTime) {
           return false
         } 
         users.set(chatId, now)
         return true
       }
       users.set(chatId, now)
       return true
    }
}