/**
 * Created by HwangJaeYoung on 2015-10-11.
 */

// extract the modules
var mysql = require('mysql');
var requestToAnotherServer = require('request');
var async = require('async');
var dbConfig = require('./DatabaseConfig');

global.AEName = ''; // ���������� ����ϴ� AE�� �����Ѵ�.

// AE�� ������ �Ŀ� �������� attribute���� ���� �� �ִµ� �ݺ������� �����ϱ� ���� �Լ��̴�.
var requestFunction = function(response, attributeName, type, value) {

    console.log('values : ' + attributeName + ', ' + type + ', ' + value);
    // ********************** Container�� ����� �����Ѵ�. ***************************s
    requestToAnotherServer( { url : 'http://210.107.239.106:7579/mobius-yt/' + AEName,
        method : 'POST',
        json : true,
        headers : { // Mobius�� Container ����� ���� �⺻ ��� ����
            'Accept' : 'application/json',
            'locale' : 'ko',
            'X-M2M-RI' : '12345',
            'X-M2M-Origin' : 'Origin',
            'X-M2M-NM' : '' + attributeName, // Fiware���� ������ attribute�̸��� ����Ѵ�.(e.g. temperature)
            'content-type' : 'application/vnd.onem2m-res+json; ty=3',
            'nmtype' : 'long'
        },
        body: { // Container�� ����Ҷ� �ʿ��� payload json ������ �ۼ��Ѵ�.
            "containerType": "heartbeat",
            "heartbeatPeriod": "300"
        }
    }, function(error, containerCreateResponse, body) {
        console.log('in contentInstance');
        // ********************** containerInstance�� ����� �����Ѵ�. ***************************.
        requestToAnotherServer( { url : 'http://210.107.239.106:7579/mobius-yt/' + AEName + '/'+ attributeName,
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
                "contentInfo": type,
                "content": value
            }
        }, function(error, contentInstanceResponse, body) {
            if(contentInstanceResponse.statusCode == 201) { // ���������� ����� �� �Ǿ��� ��
                console.log('AE, Container, contentInstance crease success!!');
                response.status(201).send();
            } else
                response.status(404).send();
        });
    });
};

exports.getFiwareInfo = function(response, entityName){

    AEName = entityName;
    // Fiware�� �����Ͽ� entityName�� ���� ������ ������ �´�.
    requestToAnotherServer( { url : 'http://193.48.247.246:1026/v1/queryContext',
        method : 'POST',
        json : true,
        headers : { // fiware���ٿ� �ʿ��� �⺻ ����� ����
            'content-type' : 'application/json',
            'Accept' : 'application/json',
            'Fiware-Service' : fiwareService,
            'Fiware-ServicePat2h' : fiwareServicePath
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

            requestToAnotherServer( { url : 'http://http://193.48.247.246:1026/v1/subscribeContext',
                method : 'POST',
                json : true,
                headers : { // fiware���ٿ� �ʿ��� �⺻ ����� ����
                    'content-type' : 'application/json',
                    'Accept' : 'application/json',
                    'Fiware-Service' : fiwareService,
                    'Fiware-ServicePat2h' : fiwareServicePath
                },
                body: { // subscription�� ����Ҷ� �ʿ��� payload json ������ �ۼ��Ѵ�.
                    "entities": [
                        {
                            "type": "thing",
                            "isPattern": "false",
                            "id": "" + AEName
                        }
                    ],
                    "attributes" : [
                        attributeName
                    ],
                    "reference" : "http://ProxyServer/FiwareNotificationEndpoint", // ���߿� endpoint�� �����Ѵ�.
                    "duration" : "P1M",
                    "notifyConditions" : [
                        {
                            "type" : "ONTIMEINTERVAL",
                            "condValues" : [
                                "PT10S"
                            ]
                        }
                    ]
                }
            }, function(error, containerCreateResponse, body) {
                // ********************** AE�� ����� �����Ѵ�. ***************************
                requestToAnotherServer( { url : 'http://210.107.239.106:7579/mobius-yt',
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
                    var registerCount = 0;

                    // attributes�� ���ÿ� �����ϱ� ���� ����ȭ�� �ʿ��ϴ�.
                    async.whilst(function( ) {
                            // Ż������ ������ attribute�� ������ Ȯ���Ͽ� ������ŭ �����Ѵ�.
                            return registerCount < attributeName.length;
                        },

                        function (dummyCallback) { // dummyCallback�� ����ϴ� �Լ��� �ƴϴ�.
                            console.log('in async');
                            // �ݺ������� �����ϱ� ���� ȣ���Ѵ�. �� �� ȣ���� ������  registerCount�˻縦 ���������� �˻��Ͽ� �����Ѵ�.
                            requestFunction(response, attributeName[registerCount], type[registerCount], value[registerCount]);
                            registerCount++;
                            setTimeout(dummyCallback, 1000); // 1�� �ֱ�� �ش��Լ��� �����Ѵ�.
                        },
                        function (err) { // �߰��� ������ �߻��ϰų� Ż������ Ȯ���� ���������� ������ ��
                            console.log("End");
                        }
                    )
                });
            });
        }
    });
};