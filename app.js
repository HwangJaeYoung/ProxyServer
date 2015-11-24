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

// ���� �Ϸ��� �ϴ� FIWARE������ ��ġ�� �����Ѵ�.
global.fiwareService = 'fiwareiot';
global.fiwareServicePath = '/';
global.fiwareIP = 'http://130.206.80.40:1026';
global.yellowTurtleIP = 'http://203.253.128.151:7579';
global.proxyIP = 'http://52.192.114.25:62590'; // ���Ͻø� ����ϴ� ��ҿ� ���� IP�� ������ �־�� �Ѵ�.
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

    var entityNameArray = []; // Fiware�� ��ϵ� entityID�� �̸� �˰� �ִٰ� �����ϰ� �����Ѵ�.
    var entityTypeArray = []; // Fiware�� ��ϵ� entityType�� �̸� �˰� �ִٰ� �����ϰ� �����Ѵ�.

    // ���� Fiware�� ContextBroker���� 4���� Entity�� ����Ǿ� �ִٰ� �����Ѵ�.
    // ����� Entity�� �̸��� Type�� ������� �����Ѵ�.
    entityNameArray[0] = "TestEntity"; entityNameArray[1] = "TestEntity2"; entityNameArray[2] = "TestEntity3"; entityNameArray[3] = "TestEntity4";
    entityTypeArray[0] = "thing"; entityTypeArray[1] = "thing"; entityTypeArray[2] = "thing"; entityTypeArray[3] = "thing";

    var fiwareInfo = new Entity( );
    fiwareInfo.setEntityName(entityNameArray);
    fiwareInfo.setEntityType(entityTypeArray);

    //register.fiwareDeviceRegistration(fiwareInfo) // ������ ���۵��ڸ��� Fiware ����̽��� ����� �����Ѵ�.
});