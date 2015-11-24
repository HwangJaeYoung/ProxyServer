/**
 * Created by HwangJaeYoung on 2015-10-10.
 * forest62590@gmail.com
 */

// extract the modules
var http = require('http');
var express = require('express');
var HashMap = require('hashmap');
var bodyParser = require('body-parser');
var register = require('./Proxy/Register');
var update = require('./Proxy/Subscription');
var app = express( );
var map = new HashMap();
const crypto = require('crypto');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json( ));
app.use(app.router);

// 접근 하려고 하는 FIWARE서비스의 위치를 정의한다.
global.fiwareService = 'fiwareiot';
global.fiwareServicePath = '/';
global.fiwareIP = 'http://130.206.80.40:1026';
global.yellowTurtleIP = 'http://203.253.128.151:7579';
global.proxyIP = 'http://52.192.114.25:62590'; // 프록시를 사용하는 장소에 따라 IP를 수정해 주어야 한다.
global.randomValueBase64 = function(len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')   // convert to base64 format
        .slice(0, len)        // return required number of characters
        .replace(/\+/g, '0')  // replace '+' with '0'
        .replace(/\//g, '0'); // replace '/' with '0'
};

function Entity( ) {
    this.entityName = [];
    this.entityType = [];

    this.setEntityName = function(entityName) {
        this.entityName = entityName;
    };

    this.getEntityName = function( ) {
        return this.entityName;
    };

    this.getEntityNameLength = function( ) {
        return this.entityName.length;
    };

    this.setEntityType = function (entityType) {
        this.entityType = entityType;
    };

    this.getEntityType = function( ) {
        return this.entityType;
    };

    this.getEntityTypeLength = function( ) {
        return this.entityType.length;
    };
}

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

    var entityNameArray = []; // Fiware에 등록된 entityID를 미리 알고 있다고 가정하고 저장한다.
    var entityTypeArray = []; // Fiware에 등록된 entityType를 미리 알고 있다고 가정하고 저장한다.

    // 현재 Fiware의 ContextBroker에는 4개의 Entity가 저장되어 있다고 가정한다.
    // 등록할 Entity의 이름과 Type을 순서대로 정의한다.
    entityNameArray[0] = "TestEntity"; entityNameArray[1] = "TestEntity2"; entityNameArray[2] = "TestEntity3"; entityNameArray[3] = "TestEntity4";
    entityTypeArray[0] = "thing"; entityTypeArray[1] = "thing"; entityTypeArray[2] = "thing"; entityTypeArray[3] = "thing";

    var fiwareInfo = new Entity( );
    fiwareInfo.setEntityName(entityNameArray);
    fiwareInfo.setEntityType(entityTypeArray);

    //register.fiwareDeviceRegistration(fiwareInfo) // 서버가 동작되자마자 Fiware 디바이스의 등록을 시작한다.
});