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
        }, function (error, fiwareResponse, body) {
        if (!error && fiwareResponse.statusCode == 200) {
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
                    'X-M2M-NM' : 'FiwareDevice',
                    'content-type' : 'application/vnd.onem2m-res+json; ty=2',
                    'nmtype' : 'long'
                },
                body: { // AE�� ����Ҷ� �ʿ��� payload json ������ �ۼ��Ѵ�.
                    "m2m:AE": {
                        "App-ID": "0.2.481.2.0001.001.000111"
                    }
                }
            }, function(error, AECreateResponse, body) {

                console.log('in container');
                // ********************** Container�� ����� �����Ѵ�. ***************************
                requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt/FiwareDevice',
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
                        "m2m:container": {
                            "containerType": "heartbeat",
                            "heartbeatPeriod": "300"
                        }
                    }
                }, function(error, containerCreateResponse, body) {
                    console.log('in contentInstance');
                    // ********************** containerInstance�� ����� �����Ѵ�. ***************************.
                    requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt/FiwareDevice/'+ attributeName,
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
                            "m2m:contentInstance": {
                                "contentInfo": type,
                                "content": value
                            }
                        }
                    }, function(error, contentInstanceResponse, body) {
                        if(contentInstanceResponse.statusCode == 201) {
                            console.log('AE, Container, contentInstance crease success!!');
                            response.status(201).send();
                        } else
                            response.status(404).send();
                    });
                });
            });
        }
    });
};