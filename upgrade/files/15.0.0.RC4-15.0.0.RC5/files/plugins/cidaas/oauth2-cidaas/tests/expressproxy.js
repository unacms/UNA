var proxy = require('express-http-proxy');
var app = require('express')();
const urlRegexp = /https:\/\/nightlybuild.cidaas.de/g;

app.use('/', proxy('https://nightlybuild.cidaas.de', {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
        console.log('\nStarting request: ' + srcReq.url + ' - ' + new Date().toString());
        console.log('Request headers:');
        console.log(proxyReqOpts.headers);
        return proxyReqOpts;
    },
    proxyReqBodyDecorator: function (bodyContent, srcReq) {
        console.log('Request body:');
        const requestBody = bodyContent.toString();
        console.log(requestBody);
        return Buffer.from(requestBody);
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
        console.log('Response status code: ' + proxyRes.statusCode);
        console.log('Response headers:');
        console.log(proxyRes.headers);
        console.log('Response body:');
        const responseBody = proxyResData.toString();
        console.log(responseBody);
        let modifiedResponseBody = responseBody;
        if (responseBody && responseBody.match(urlRegexp)) {
            modifiedResponseBody = responseBody.replace(urlRegexp, 'http://localhost:3000');
            console.log('Modified response body:');
            console.log(modifiedResponseBody);
        }
        return Buffer.from(modifiedResponseBody);
    }
}));
app.listen(3000);
