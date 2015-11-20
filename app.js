/**
 * Created by HwangJaeYoung on 2015-10-10.
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

var registerCount = 0;  // attribute 요소의 개수를 카운트 한다.

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json( ));
app.use(app.router);

// 접근 하려고 하는 FIWARE서비스의 위치를 정의한다.
global.fiwareService = 'fiwareiot';
global.fiwareServicePath = '/';
global.fiwareIP = 'http://130.206.80.40:1026';
global.yellowTurtleIP = 'http://203.253.128.151:7579';
global.proxyIP = '';

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

    var entityArray = [];
    entityArray[0] = "TestEntity"; entityArray[1] = "TestEntity2"; entityArray[2] = "TestEntity3"; entityArray[3] = "TestEntity4";

    async.whilst(function( ) {
            // 탈출조건 저장할 attribute의 갯수를 확인하여 갯수만큼 저장한다.
            return registerCount < entityArray.length;
        },
        function (dummyCallback) { // dummyCallback은 사용하는 함수가 아니다.
            // 반복적으로 저장하기 위해 호출한다. 한 번 호출이 끝나면  registerCount검사를 동기적으로 검사하여 실행한다.

            register.getFiwareInfo(entityArray[registerCount]);
            registerCount++;
            setTimeout(dummyCallback, 100); // 1초 주기로 해당함수를 실행한다.
        },
        function (err) { // 중간에 에러가 발생하거나 탈출조건 확인후 정상적으로 끝났을 때
            console.log("End");
        }
    )
});