/**
 * Created by HwangJaeYoung on 2015-10-10.
 * forest62590@gmail.com
 */

// extract the modules
var fs = require('fs');
var http = require('http');
var express = require('express');
var HashMap = require('hashmap');
var bodyParser = require('body-parser');
var register = require('./Proxy/Register');
var update = require('./Proxy/Subscription');
var unsubscription = require('./Proxy/Unsubscription');
var app = express( );
var map = new HashMap();
const crypto = require('crypto');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json( ));
app.use(app.router);

// 접근 하려고 하는 FIWARE서비스의 위치를 정의한다.
global.fiwareService = '';
global.fiwareServicePath = '';
global.fiwareIP = '';
global.yellowTurtleIP = '';
global.proxyIP = ''; // 프록시를 사용하는 장소에 따라 IP를 수정해 주어야 한다.
global.proxyPort = '';
global.subscriptionActive = '';
global.entityNameArray = [];
global.entityTypeArray = [];
global.randomValueBase64 = function(len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')   // convert to base64 format
        .slice(0, len)        // return required number of characters
        .replace(/\+/g, '0')  // replace '+' with '0'
        .replace(/\//g, '0'); // replace '/' with '0'
};

fs.readFile('conf.json', 'utf-8', function (err, data) {
    if (err) {
        console.log("FATAL An error occurred trying to read in the file: " + err);
        console.log("error : set to default for configuration");
    } else {
        var conf = JSON.parse(data)['proxy:conf'];
        var deviceInfo = conf['deviceInfo'];
        var objLength = Object.keys(deviceInfo).length;

        fiwareService = conf['fiwareService'];
        fiwareServicePath = conf['fiwareServicePath'];
        fiwareIP = conf['fiwareIP'];
        yellowTurtleIP = conf['yellowTurtleIP'];
        proxyIP = conf['proxyIP']; // 프록시를 사용하는 장소에 따라 IP를 수정해 주어야 한다.
        proxyPort = conf['proxyPort'];
        subscriptionActive = conf['subscriptionActive'];

        for(var i = 0; i < objLength; i++) {
            var device = deviceInfo[Object.keys(deviceInfo)[i]];

            entityNameArray[i] = device['entity_Name'];// Fiware에 등록된 entityID를 미리 알고 있다고 가정하고 저장한다.
            entityTypeArray[i] = device['entity_Type'];// Fiware에 등록된 entityType를 미리 알고 있다고 가정하고 저장한다.
        }

        fs.readFile('subscriptionList.txt', 'utf-8', function (err, data) {
            if (err) {
                console.log("FATAL An error occurred trying to read in the file: " + err);
                console.log("error : set to default for configuration");
            } else {
                var subIdArray = data.split("\n");

                // subscriptionList에 데이터가 있을 경우에
                if(subIdArray.length > 0 && subIdArray[0] != '') {
                    console.log('Subscription Delete start....');
                    //unsubscription.unsubscriptionFiwareDevice(subIdArray); // unsubscription을 시작한다.
                    // unsubscription을 했음에도 불구하고 Fiware에서 notification을 보내는 경우가 있기 때문에 10초 뒤에 서버를 실행한다.
                    setTimeout(function( ) {
                        serverCreate( ); // 서버의 실행
                    }, 10000);
                }
                else {
                    serverCreate( ); // 서버의 실행
                }
            }
        });
    }
});

// Fiware Subscription endpoint
app.post('/FiwareNotificationEndpoint', function(request, response) {
    var subId = request.body.subscriptionId + '\n'; // 비교를 위한 subscriptionId 저장

    if(map.has(subId) == false) {
        // 등록한 SubscriptionID를 저장하기 위해서 텍스트 파일을 사용한다.
        fs.appendFile('subscriptionList.txt', subId, function (err) {
            if(err) {
                console.log('FATAL An error occurred trying to write in the file: ' + err);
            } else {
                // console.log('Data registration success!!');
            }
        });

        map.set(subId, true);
        /* 초기에 subscription을 신청할 때 지정한 시간(ex. 15s)이 지나지 않았음에도
         바로 호출되는 경우가 있어 방지 하기위한 부분
         */
    } else
        update.updateFiwareInfo(request, response);
});

var serverCreate = function( ) {
    // Server start!!
    http.createServer(app).listen(proxyPort, function( ) {
        console.log('Server running at ' + proxyIP);

        // 현재 Fiware의 ContextBroker에는 4개의 Entity가 저장되어 있다고 가정한다.
        var fiwareInfo = new Entity( );
        fiwareInfo.setEntityName(entityNameArray);
        fiwareInfo.setEntityType(entityTypeArray);

        //register.fiwareDeviceRegistration(fiwareInfo) // 서버가 동작되자마자 Fiware 디바이스의 등록을 시작한다.
    });
}

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