/**
 * Created by HwangJaeYoung on 2015-10-11.
 * forest62590@gmail.com
 */

// extract the modules
var mysql = require('mysql');
var requestToAnotherServer = require('request');
var async = require('async');

var AEName = ''; // ���������� ����ϴ� AE�� �����Ѵ�.
var AECount = 0;
var registerCount = 0;  // attribute ����� ������ ī��Ʈ �Ѵ�.
var subscriptionCount = 0; // attribute ����� ������ ī��Ʈ �Ѵ�.

// AE�� ������ �Ŀ� �������� attribute���� ���� �� �ִµ� �ݺ������� �����ϱ� ���� �Լ��̴�.
var registerFunction = function(attributeName, type, value, registerCallback, aeCreateCallback, entityArray) {
    // ********************** Container�� ����� �����Ѵ�. ***************************
    requestToAnotherServer( { url : yellowTurtleIP + '/mobius-yt/' + AEName,
        method : 'POST',
        json : true,
        headers : { // Mobius�� Container ����� ���� �⺻ ��� ����
            'Accept' : 'application/json',
            'locale' : 'ko',
            'X-M2M-RI' : '12345',
            'X-M2M-Origin' : 'Origin',
            'X-M2M-NM' : '' + attributeName[registerCount], // Fiware���� ������ attribute�̸��� ����Ѵ�.(e.g. temperature)
            'content-type' : 'application/vnd.onem2m-res+json; ty=3',
            'nmtype' : 'long'
        },
        body: { // Container�� ����Ҷ� �ʿ��� payload json ������ �ۼ��Ѵ�.
            "containerType": "heartbeat",
            "heartbeatPeriod": "300"
        }
    }, function(error, containerCreateResponse, body) {
        // ********************** containerInstance�� ����� �����Ѵ�. ***************************.
        requestToAnotherServer( { url : yellowTurtleIP + '/mobius-yt/' + AEName + '/'+ attributeName[registerCount],
            method : 'POST',
            json : true,
            headers : { // Mobius�� contentInstance����� ���� �⺻ ��� ����
                'Accept' : 'application/json',
                'locale' : 'ko',
                'X-M2M-RI' : '12345',
                'X-M2M-Origin' : 'Origin',
                'X-M2M-NM' : 'deviceinfo', // Fiware���� ������ attribute�̸��� ����Ѵ�.(e.g. temperature)
                'content-type' : 'application/vnd.onem2m-res+json; ty=4',
                'nmtype' : 'long'
            },
            body: { // contentInstance�� ����Ҷ� �ʿ��� payload json ������ �ۼ��Ѵ�.
                "contentInfo": type[registerCount],
                "content": value[registerCount]
            }
        }, function(error, contentInstanceResponse, body) {

            if(contentInstanceResponse.statusCode == 201) { // ���������� ����� �� �Ǿ��� ��

                if(registerCount < attributeName.length - 1) {
                    registerCount++;
                    registerCallback(attributeName, type, value, registerFunction, aeCreateCallback, entityArray);
                } else {
                    registerCount = 0; // ��� �� ���� �Ͽ����Ƿ� �ʱ�ȭ �Ѵ�.

                    if(AECount < entityArray.length - 1) {
                        AECount++;
                        aeCreateCallback(entityArray);
                    } else {
                        console.log('*****************************************')
                        console.log("All create");
                        console.log('*****************************************')

                        subscriptionToContextBroker(entityArray);
                    }
                }
            } else {
                console.log('*****************************************')
                console.log("Create Error : " + contentInstanceResponse.statusCode);
                console.log('*****************************************')
            }
        });
    });
};

var subscriptionToContextBroker = function (entityArray) {

    var AEName = entityArray[subscriptionCount];

    // Fiware�� �����Ͽ� entityName�� ���� ������ ������ �´�.
    requestToAnotherServer( { url :  fiwareIP + '/v1/queryContext',
            method : 'POST',
            json : true,
            headers : { // fiware���ٿ� �ʿ��� �⺻ ����� ����
                'content-type' : 'application/json',
                'Accept' : 'application/json',
                'Fiware-Service' : fiwareService,
                'Fiware-ServicePath' : fiwareServicePath
            },
            body: { // NGSI10�� ���� payload�� �����̴�.(queryContext)
                'entities': [
                    {
                        "type": "thing",
                        "isPattern": "false",
                        "id": "" + AEName
                    }
                ]
            }
        }, function (error, fiwareResponse, body) {
            if (!error && fiwareResponse.statusCode == 200) {
                // ContextBroker���� �����ϴ� json������ ���� �Ľ��� �����Ѵ�.
                var contextResponses = body.contextResponses
                var contextElement = contextResponses[0].contextElement;
                var attributes = contextElement.attributes;

                var attributeName = [], type = [], value = []; // Ư�� attribute�� �����ϱ����� �迭
                var count = 0;

                for (var i = 0; i < attributes.length; i++) {
                    if (attributes[i].name == 'TimeInstant' || attributes[i].name == 'att_name') {
                        continue;
                    } else {
                        // ���ҽ� ��Ͽ� �ʿ��� ������ �Ľ�
                        attributeName[count] = attributes[i].name;
                        type[count] = attributes[i].type;
                        value[count] = attributes[i].value;
                        count++;
                    }
                }

                requestToAnotherServer({
                    url: fiwareIP + '/v1/subscribeContext',
                    method: 'POST',
                    json: true,
                    headers: { // fiware���ٿ� �ʿ��� �⺻ ����� ����
                        'content-type': 'application/json',
                        'Accept': 'application/json',
                        'Fiware-Service': fiwareService,
                        'Fiware-ServicePath': fiwareServicePath
                    },
                    body: { // subscription�� ����Ҷ� �ʿ��� payload json ������ �ۼ��Ѵ�.
                        "entities": [
                            {
                                "type": "thing",
                                "isPattern": "false",
                                "id": "" + AEName
                            }
                        ],
                        "attributes": attributeName,
                        "reference": proxyIP + '/FiwareNotificationEndpoint', // ���߿� endpoint�� �����Ѵ�.
                        "duration": "P1M",
                        "notifyConditions": [
                            {
                                "type": "ONTIMEINTERVAL",
                                "condValues": [
                                    "PT15S"
                                ]
                            }
                        ]
                    }
                }, function (error, subscriptionResponse, body) {
                    console.log("FiwareDevice Register Success");

                    if(subscriptionCount < entityArray.length - 1) {
                        subscriptionCount++;
                        subscriptionToContextBroker(entityArray);
                    } else {
                        console.log('*****************************************');
                        console.log("Subscription All Create");
                        console.log('*****************************************');
                    }
                });
            }
    });
}

var getFiwareInfo = function(entityArray){

    AEName = entityArray[AECount];
    console.log('Creating..... ' + AEName);

    // Fiware�� �����Ͽ� entityName�� ���� ������ ������ �´�.
    requestToAnotherServer( { url :  fiwareIP + '/v1/queryContext',
        method : 'POST',
        json : true,
        headers : { // fiware���ٿ� �ʿ��� �⺻ ����� ����
            'content-type' : 'application/json',
            'Accept' : 'application/json',
            'Fiware-Service' : fiwareService,
            'Fiware-ServicePath' : fiwareServicePath
        },
        body: { // NGSI10�� ���� payload�� �����̴�.(queryContext)
            'entities': [
                {
                    "type": "thing",
                    "isPattern": "false",
                    "id": "" + AEName
                }
            ]
        }
    }, function (error, fiwareResponse, body) {
        if (!error && fiwareResponse.statusCode == 200) {
            // ContextBroker���� �����ϴ� json������ ���� �Ľ��� �����Ѵ�.
            var contextResponses = body.contextResponses
            var contextElement = contextResponses[0].contextElement;
            var attributes = contextElement.attributes;

            var attributeName = [], type = [], value = []; // Ư�� attribute�� �����ϱ����� �迭
            var count = 0;

            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].name == 'TimeInstant' || attributes[i].name == 'att_name') {
                    continue;
                } else {
                    // ���ҽ� ��Ͽ� �ʿ��� ������ �Ľ�
                    attributeName[count] = attributes[i].name;
                    type[count] = attributes[i].type;
                    value[count] =  attributes[i].value;
                    count++;
                }
            }

            // ********************** AE�� ����� �����Ѵ�. ***************************
            requestToAnotherServer( { url :  yellowTurtleIP + '/mobius-yt',
                method : 'POST',
                json : true,
                headers : { // Mobius�� AE����� ���� �⺻ ��� ����
                    'Accept' : 'application/json',
                    'locale' : 'ko',
                    'X-M2M-RI' : '12345',
                    'X-M2M-Origin' : 'Origin',
                    'X-M2M-NM' : AEName,
                    'content-type' : 'application/vnd.onem2m-res+json; ty=2',
                    'nmtype' : 'long'
                },
                body : { // NGSI10�� ���� payload�� �����̴�.(queryContext)
                    'App-ID': "0.2.481.2.0001.001.000111"
                }
            }, function(error, AECreateResponse, body) {
                console.log("AE create status : " + AECreateResponse.statusCode);
                registerFunction(attributeName, type, value, registerFunction, getFiwareInfo, entityArray);
            });
        }
    });
};

exports.fiwareDeviceRegistration = function(entityArray) {
    getFiwareInfo(entityArray);
}