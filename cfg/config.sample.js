module.exports = {
    baseDomain: "",
    baseUrl: "",
    apiUrl: "",
    apiSecret: "",
    throttle: 1,
    tgSalt: "jkt6dhrnd4",
    checkTimeMinutes: 15,
    userPerRequest: 30,
    workerCount: 1,
    //nodeSocket: '',
    nodePort: 3002,
    
    // mongo
    mongodb: {
        host: "",
        port: 27017,
        db: "",
        auth: {
            user: "",
            password: "",
        },
    },
};