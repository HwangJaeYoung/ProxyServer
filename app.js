/**
 * Created by HwangJaeYoung on 2015-10-10.
 */

// extract the modules
var http = require('http');
var express = require('express');
var register = require('./Proxy/Register');
var update = require('./Proxy/Subscription');

var app = express( );

// 접근 하려고 하는 FIWARE서비스의 위치를 정의한다.
global.fiwareService = 'egmul20';
global.fiwareServicePath = '/egmul20path';

app.use(app.router);

//  Register Fiware Device infomation
app.get('/FiwareDeviceRegister/:entityName', function(request, response) {
    var entityName = request.params.entityName; // Mobius에서 등록하고 싶은 Device의 EntityID를 전달한다.
    // Fiware의 정보를 가져와서 AE, Container, contentInstance를 구성하여 등록한다.
    register.getFiwareInfo(response, entityName);
});

// Fiware Subscription endpoint
app.post('/FiwareNotificationEndpoint', function(request, response) {
    update.updateFiwareInfo(request, response);
});

// Server start!!
http.createServer(app).listen(62590, function( ) {
    console.log("Server running at http://127.0.0.1:62590");
});