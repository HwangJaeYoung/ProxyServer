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

// ���� �Ϸ��� �ϴ� FIWARE������ ��ġ�� �����Ѵ�.
global.fiwareService = '';
global.fiwareServicePath = '';
global.fiwareIP = '';
global.yellowTurtleIP = '';
global.proxyIP = ''; // ���Ͻø� ����ϴ� ��ҿ� ���� IP�� ������ �־�� �Ѵ�.
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
        proxyIP = conf['proxyIP']; // ���Ͻø� ����ϴ� ��ҿ� ���� IP�� ������ �־�� �Ѵ�.
        proxyPort = conf['proxyPort'];
        subscriptionActive = conf['subscriptionActive'];

        for(var i = 0; i < objLength; i++) {
            var device = deviceInfo[Object.keys(deviceInfo)[i]];

            entityNameArray[i] = device['entity_Name'];// Fiware�� ��ϵ� entityID�� �̸� �˰� �ִٰ� �����ϰ� �����Ѵ�.
            entityTypeArray[i] = device['entity_Type'];// Fiware�� ��ϵ� entityType�� �̸� �˰� �ִٰ� �����ϰ� �����Ѵ�.
        }

        fs.readFile('subscriptionList.txt', 'utf-8', function (err, data) {
            if (err) {
                console.log("FATAL An error occurred trying to read in the file: " + err);
                console.log("error : set to default for configuration");
            } else {
                var subIdArray = data.split("\n");

                // subscriptionList�� �����Ͱ� ���� ��쿡
                if(subIdArray.length > 0 && subIdArray[0] != '') {
                    console.log('Subscription Delete start....');
                    //unsubscription.unsubscriptionFiwareDevice(subIdArray); // unsubscription�� �����Ѵ�.
                    // unsubscription�� �������� �ұ��ϰ� Fiware���� notification�� ������ ��찡 �ֱ� ������ 10�� �ڿ� ������ �����Ѵ�.
                    setTimeout(function( ) {
                        serverCreate( ); // ������ ����
                    }, 10000);
                }
                else {
                    serverCreate( ); // ������ ����
                }
            }
        });
    }
});

// Fiware Subscription endpoint
app.post('/FiwareNotificationEndpoint', function(request, response) {
    var subId = request.body.subscriptionId + '\n'; // �񱳸� ���� subscriptionId ����

    if(map.has(subId) == false) {
        // ����� SubscriptionID�� �����ϱ� ���ؼ� �ؽ�Ʈ ������ ����Ѵ�.
        fs.appendFile('subscriptionList.txt', subId, function (err) {
            if(err) {
                console.log('FATAL An error occurred trying to write in the file: ' + err);
            } else {
                // console.log('Data registration success!!');
            }
        });

        map.set(subId, true);
        /* �ʱ⿡ subscription�� ��û�� �� ������ �ð�(ex. 15s)�� ������ �ʾ�������
         �ٷ� ȣ��Ǵ� ��찡 �־� ���� �ϱ����� �κ�
         */
    } else
        update.updateFiwareInfo(request, response);
});

var serverCreate = function( ) {
    // Server start!!
    http.createServer(app).listen(proxyPort, function( ) {
        console.log('Server running at ' + proxyIP);

        // ���� Fiware�� ContextBroker���� 4���� Entity�� ����Ǿ� �ִٰ� �����Ѵ�.
        var fiwareInfo = new Entity( );
        fiwareInfo.setEntityName(entityNameArray);
        fiwareInfo.setEntityType(entityTypeArray);

        //register.fiwareDeviceRegistration(fiwareInfo) // ������ ���۵��ڸ��� Fiware ����̽��� ����� �����Ѵ�.
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