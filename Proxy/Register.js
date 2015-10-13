/**
 * Created by HwangJaeYoung on 2015-10-11.
 */

// extract the modules
var mysql = require('mysql');
var requestToAnotherServer = require('request');
var dbConfig = require('./DatabaseConfig');

exports.getFiwareInfo = function(response, entityName){

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
                        "id": "" + entityName
                    }
                ]
            }
        }, function (error, responseAnotherServer, body) {
        if (!error && responseAnotherServer.statusCode == 200) {
            // ContextBroker���� �����ϴ� json������ ���� �Ľ��� �����Ѵ�.
            var contextResponses = body.contextResponses
            var contextElement = contextResponses[0].contextElement;
            var attributes = contextElement.attributes;

            var entityID = contextElement.id; // ContextBroker�� ������ EntityID
            var type = contextElement.type; // Entity�� Type�� ����

            console.log(entityID + ' : ' + type);

            var attributeName, type, value;

            // Ư�� attribute�� ã�Ƴ��� ����� �Ѱ��� �����ϴ�.
            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].name == 'TimeInstant') { }
                else if (attributes[i].name == 'att_name') { }
                else {
                    // ���ҽ� ��Ͽ� �ʿ��� ������ �Ľ�
                    attributeName = attributes[i].name;
                    type = attributes[i].type;
                    value =  attributes[i].value;
                }
            }

            // ********************** AE�� ����� �����Ѵ�. ***************************
            requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt',
                method : 'POST',
                json : true,
                headers : { // Mobius�� AE����� ���� �⺻ ��� ����
                    'Accept' : 'application/json',
                    'locale' : 'ko',
                    'X-M2M-RI' : '12345',
                    'X-M2M-Origin' : 'Origin',
                    'X-M2M-NM' : '' + attributeName, // Fiware���� ������ attribute�̸��� ����Ѵ�.(e.g. temperature)
                    'content-type' : 'application/json',
                    'nmtype' : 'long'
                },
                body: { // AE�� ����Ҷ� �ʿ��� payload xml ������ �ۼ��Ѵ�.
                    'entities': [
                        {
                            "type": "thing",
                            "isPattern": "false",
                            "id": "" + entityName
                        }
                    ]
                }
            }, function(error, responseAnotherServer, body) {
                // ********************** Container�� ����� �����Ѵ�. ***************************
                requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt',
                    method : 'POST',
                    json : true,
                    headers : { // Mobius�� AE����� ���� �⺻ ��� ����
                        'Accept' : 'application/json',
                        'locale' : 'ko',
                        'X-M2M-RI' : '12345',
                        'X-M2M-Origin' : 'Origin',
                        'X-M2M-NM' : '' + attributeName, // Fiware���� ������ attribute�̸��� ����Ѵ�.(e.g. temperature)
                        'content-type' : 'application/json',
                        'nmtype' : 'long'
                    },
                    body: { // AE�� ����Ҷ� �ʿ��� payload xml ������ �ۼ��Ѵ�.
                        'entities': [
                            {
                                "type": "thing",
                                "isPattern": "false",
                                "id": "" + entityName
                            }
                        ]
                    }
                }, function(error, responseAnotherServer, body) {
                    // ********************** containerInstance�� ����� �����Ѵ�. ***************************.
                    requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt',
                        method : 'POST',
                        json : true,
                        headers : { // Mobius�� AE����� ���� �⺻ ��� ����
                            'Accept' : 'application/json',
                            'locale' : 'ko',
                            'X-M2M-RI' : '12345',
                            'X-M2M-Origin' : 'Origin',
                            'X-M2M-NM' : '' + attributeName, // Fiware���� ������ attribute�̸��� ����Ѵ�.(e.g. temperature)
                            'content-type' : 'application/json',
                            'nmtype' : 'long'
                        },
                        body: { // AE�� ����Ҷ� �ʿ��� payload xml ������ �ۼ��Ѵ�.
                            'entities': [
                                {
                                    "type": "thing",
                                    "isPattern": "false",
                                    "id": "" + entityName
                                }
                            ]
                        }
                    }, function(error, responseAnotherServer, body) {
                        if(responseAnotherServer.statusCode == '201') {
                            // �������� ��� �������� �Ѵ�.

                        }
                    });
                });
            });
        }
    });
};