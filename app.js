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
var app = express( );
var map = new HashMap();
const crypto = require('crypto');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json( ));
app.use(app.router);

// ���� �Ϸ��� �ϴ� FIWARE������ ��ġ�� �����Ѵ�.
global.fiwareService = 't';
global.fiwareServicePath = '';
global.fiwareIP = '';
global.yellowTurtleIP = '';
global.proxyIP = ''; // ���Ͻø� ����ϴ� ��ҿ� ���� IP�� ������ �־�� �Ѵ�.
global.entityNameArray = [];
global.entityTypeArray = [];

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
        proxyIP = conf['proxyIP']; // ���Ͻø� ����ϴ� ��ҿ� ���� IP�� ������ �־�� �Ѵ�.

        for(var i = 0; i < objLength; i++) {
            var device = deviceInfo[Object.keys(deviceInfo)[i]];

            entityNameArray[i] = device['entity_Name'];// Fiware�� ��ϵ� entityID�� �̸� �˰� �ִٰ� �����ϰ� �����Ѵ�.
            entityTypeArray[i] = device['entity_Type'];// Fiware�� ��ϵ� entityType�� �̸� �˰� �ִٰ� �����ϰ� �����Ѵ�.
        }

        // Server start!!
        http.createServer(app).listen(62590, function( ) {
            console.log("Server running at http://127.0.0.1:62590");

            // ���� Fiware�� ContextBroker���� 4���� Entity�� ����Ǿ� �ִٰ� �����Ѵ�.
            var fiwareInfo = new Entity( );
            fiwareInfo.setEntityName(entityNameArray);
            fiwareInfo.setEntityType(entityTypeArray);

            register.fiwareDeviceRegistration(fiwareInfo) // ������ ���۵��ڸ��� Fiware ����̽��� ����� �����Ѵ�.
        });
    }
});

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