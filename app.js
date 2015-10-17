/**
 * Created by HwangJaeYoung on 2015-10-10.
 */

// extract the modules
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var register = require('./Proxy/Register');
var update = require('./Proxy/Subscription');

var app = express( );

// bodyPaerser ��ġ ����Ű�� post parsing�� �ȵȴ�.....;;
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json( ));
app.use(app.router);

// ���� �Ϸ��� �ϴ� FIWARE������ ��ġ�� �����Ѵ�.
global.fiwareService = 'egmul20';
global.fiwareServicePath = '/egmul20path';
global.subscriptionChecking = false;

//  Register Fiware Device infomation
app.get('/FiwareDeviceRegister/:entityName', function(request, response) {
    var entityName = request.params.entityName; // Mobius���� ����ϰ� ���� Device�� EntityID�� �����Ѵ�.
    // Fiware�� ������ �����ͼ� AE, Container, contentInstance�� �����Ͽ� ����Ѵ�.
    register.getFiwareInfo(response, entityName);
});

// Fiware Subscription endpoint
app.post('/FiwareNotificationEndpoint', function(request, response) {
    // ContextBroker�� ������ JSON data�� ������ contentInstance�� ������Ʈ �Ѵ�.
    if(subscriptionChecking == true)
        update.updateFiwareInfo(request, response);
    else
        subscriptionChecking = true;
});

// Server start!!
http.createServer(app).listen(62590, function( ) {
    console.log("Server running at http://127.0.0.1:62590");
});