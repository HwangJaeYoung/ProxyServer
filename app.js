/**
 * Created by HwangJaeYoung on 2015-10-10.
 */

// extract the modules
var http = require('http');
var express = require('express');
var register = require('./Proxy/Register');

var app = express( );

// ���� �Ϸ��� �ϴ� FIWARE������ ��ġ�� �����Ѵ�.
global.fiwareService = 'egmul20';
global.fiwareServicePath = '/egmul20path';

app.use(app.router);

// Register Fiware Device to Mobius
app.get('/FiwareDeviceCreate', function(request, response) {

});

//  Register Fiware Device infomation
app.get('/FiwareDeviceRegister/:entityName', function(request, response) {
    var entityName = request.params.entityName; // Mobius���� ����ϰ� ���� Device�� EntityID�� �����Ѵ�.
    // Fiware�� ������ �����ͼ� AE, Container, contentInstance�� �����Ͽ� ����Ѵ�.
    register.getFiwareInfo(response, entityName);
});

// Server start!!
http.createServer(app).listen(62590, function( ) {
    console.log("Server running at http://127.0.0.1:62590");
});