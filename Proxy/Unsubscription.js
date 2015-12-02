/**
 *  Created by HwangJaeYoung on 2015-11-30.
 *  forest62590@gmail.com
 */

var fs = require('fs');
var useAppFunction = require('../app.js');
var requestToAnotherServer = require('request');
var unsubscriptionCount = 0;

var unsubscriptionFunction = function(subIdArray, unsubscriptionCallback) {
    // ********************** unsubscription�� �ϱ� ���� ContextBroker�� ��û���Ѵ�. ***************************
    requestToAnotherServer({
        url:  fiwareIP + '/v1/unsubscribeContext',
        method: 'POST',
        json: true,
        headers: { // ContextBroker�� Unsubscription�� �ϱ����� �������
            'content-type' : 'application/json',
            'Accept' : 'application/json',
            'Fiware-Service' : fiwareService,
            'Fiware-ServicePath' : fiwareServicePath
        },
        body: { // Unsubscription�� �Ҷ� �ʿ��� body ������ �ۼ��Ѵ�.
            "subscriptionId" : subIdArray[unsubscriptionCount]
        }
    }, function (error, unsubscriptionResponse, body) {
        if (!error && unsubscriptionResponse.statusCode == 200) {
            if (unsubscriptionCount < subIdArray.length - 2) {
                unsubscriptionCount++;
                unsubscriptionCallback(subIdArray, unsubscriptionFunction);
            } else { // ��� Entity�� Unsubscription ����
                console.log('******* Unsubscription Success *******');

                fs.writeFile('subList.txt', '', function (error) {
                    if(error) {
                        console.log('FATAL An error occurred trying to write in the file: ' + err);
                    } else {
                        console.log('Data registration success!!');
                        useAppFunction.serverCreate( );
                    }
                });
            }
        } else { // Entity Unsubscription �߰��� ������ ���
            console.log('******* Unsubscription error *******');
        }
    });
};

exports.unsubscriptionFiwareDevice = function(subIdArray){
    unsubscriptionFunction(subIdArray, unsubscriptionFunction);
};