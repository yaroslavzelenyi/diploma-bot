const request = require('request');
const config = require('../cfg/config');

module.exports = {
    sendRequest
}

function sendRequest(url, type = "POST", body = {}) {
    const fullUrl = config.apiUrl + url;
    const headers = {
        'Content-type': 'application/json'
    }
    if (config.apiSecret) {
        headers['Authorization'] = config.apiSecret;
    }

    const send_body = body;

    return new Promise((res, rej) => 
        request({
            url: fullUrl,
            method: type,
            headers: headers,
            body: JSON.stringify(body)
        }, async function (err, response, body) {
            if (err) {
                console.error(err);
                throw new Error(err);
            }
            if (body.error) {
                return res(undefined);
            }

            let json = {}

            try {
                json = JSON.parse( body );
            } catch(e) {
                throw new Error(e.message);
            }

            console.log('URL', fullUrl);
            console.log('headers', headers);
            console.log('sent body', send_body);
            console.log('body', json);

            return res(json);
        })
    );
} 