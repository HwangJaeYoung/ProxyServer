/**
 * Created by HwangJaeYoung on 2015-10-10.
 * forest62590@gmail.com
 */

// extract the modules
var http = require('http');
var async = require('async');
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
global.fiwareService = 'fiwareiot';
global.fiwareServicePath = '/';
global.fiwareIP = 'http://130.206.80.40:1026';
global.yellowTurtleIP = 'http://203.253.128.151:7579';
global.proxyIP = 'http://52.192.114.25:62590'; // 프록시를 사용하는 장소에 따라 IP를 수정해 주어야 한다.

var map = new HashMap();

// Fiware Subscription endpoint
app.post('/FiwareNotificationEndpoint', function(request, response) {
    var startDate = new Date();
    var startTime = parseInt(startDate.getMilliseconds());

    var subId = request.body.subscriptionId; // 비교를 위한 subscriptionId 저장

    /* 초기에 subscription을 신청할 때 지정한 시간(ex. 15s)이 지나지 않았음에도
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

    var entityArray = []; // Fiware에 등록된 entityID를 미리 알고 있다고 가정하고 저장한다.
    entityArray[0] = "TestEntity"; entityArray[1] = "TestEntity2"; entityArray[2] = "TestEntity3"; entityArray[3] = "TestEntity4";
    // 현재 Fiware의 ContextBroker에는 4개의 Entity가 저장되어 있다고 가정한다.

    register.fiwareDeviceRegistration(entityArray) // 서버가 동작되자마자 Fiware 디바이스의 등록을 시작한다.
});