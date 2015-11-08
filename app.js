/**
 * Created by HwangJaeYoung on 2015-10-10.
 */

// extract the modules
var http = require('http');
var express = require('express');
var HashMap = require('hashmap');
var bodyParser = require('body-parser');
var register = require('./Proxy/Register');
var update = require('./Proxy/Subscription');

var app = express( );

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json( ));
app.use(app.router);

// 접근 하려고 하는 FIWARE서비스의 위치를 정의한다.
global.fiwareService = 'egmul20';
global.fiwareServicePath = '/egmul20path';

var map = new HashMap();

//  Register Fiware Device infomation
app.get('/FiwareDeviceRegister/:entityName', function(request, response) {
    var entityName = request.params.entityName; // Mobius에서 등록하고 싶은 Device의 EntityID를 전달한다.
    // Fiware의 정보를 가져와서 AE, Container, contentInstance를 구성하여 등록한다.
    register.getFiwareInfo(response, entityName);
});

// Fiware Subscription endpoint
app.post('/FiwareNotificationEndpoint', function(request, response) {
    var startDate = new Date();
    var startTime = parseInt(startDate.getMilliseconds());

    var subId = request.body.subscriptionId; // 비교를 위한 subscriptionId 저장

    /* 초기에 subscription을 신청할때 지정한 시간(ex. 15s)이 지나지 않았음에도
       바로 호출되는 경우가 있어 방지 하기위한 부분
     */
    if(map.has(subId) == false)
        map.set(subId, true);
    else
        update.updateFiwareInfo(request, response, startTime);
});

// Server start!!
http.createServer(app).listen(62590, function( ) {
    console.log("Server running at http://127.0.0.1:62590");
});