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

// ���� �Ϸ��� �ϴ� FIWARE������ ��ġ�� �����Ѵ�.
global.fiwareService = 'fiwareiot';
global.fiwareServicePath = '/';
global.fiwareIP = 'http://130.206.80.40:1026';
global.yellowTurtleIP = 'http://203.253.128.151:7579';
global.proxyIP = 'http://52.192.114.25:62590'; // ���Ͻø� ����ϴ� ��ҿ� ���� IP�� ������ �־�� �Ѵ�.

var map = new HashMap();

// Fiware Subscription endpoint
app.post('/FiwareNotificationEndpoint', function(request, response) {
    var startDate = new Date();
    var startTime = parseInt(startDate.getMilliseconds());

    var subId = request.body.subscriptionId; // �񱳸� ���� subscriptionId ����

    /* �ʱ⿡ subscription�� ��û�� �� ������ �ð�(ex. 15s)�� ������ �ʾ�������
       �ٷ� ȣ��Ǵ� ��찡 �־� ���� �ϱ����� �κ�
     */
    if(map.has(subId) == false)
        map.set(subId, true);
    else
        update.updateFiwareInfo(request, response, startTime);
});

// Server start!!
http.createServer(app).listen(62590, function( ) {
    console.log("Server running at http://127.0.0.1:62590");

    var entityArray = []; // Fiware�� ��ϵ� entityID�� �̸� �˰� �ִٰ� �����ϰ� �����Ѵ�.
    entityArray[0] = "TestEntity"; entityArray[1] = "TestEntity2"; entityArray[2] = "TestEntity3"; entityArray[3] = "TestEntity4";
    // ���� Fiware�� ContextBroker���� 4���� Entity�� ����Ǿ� �ִٰ� �����Ѵ�.

    register.fiwareDeviceRegistration(entityArray) // ������ ���۵��ڸ��� Fiware ����̽��� ����� �����Ѵ�.
});