/**
 * Created by HwangJaeYoung on 2015-10-11.
 */

// extract the modules
var mysql = require('mysql');
var requestToAnotherServer = require('request');
var async = require('async');
var dbConfig = require('./DatabaseConfig');

var AEName = ''; // 공통적으로 사용하는 AE를 정의한다.
var registerCount = 0;  // attribute 요소의 개수를 카운트 한다.

// AE를 생성한 후에 여러개의 attribute들이 있을 수 있는데 반복적으로 정의하기 위한 함수이다.
var registerFunction = function(response, attributeName, type, value, registerCallback) {
    // ********************** Container에 등록을 시작한다. ***************************
    requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt/' + AEName,
        method : 'POST',
        json : true,
        headers : { // Mobius에 Container 등록을 위한 기본 헤더 구조
            'Accept' : 'application/json',
            'locale' : 'ko',
            'X-M2M-RI' : '12345',
            'X-M2M-Origin' : 'Origin',
            'X-M2M-NM' : '' + attributeName[registerCount], // Fiware에서 가져온 attribute이름을 사용한다.(e.g. temperature)
            'content-type' : 'application/vnd.onem2m-res+json; ty=3',
            'nmtype' : 'long'
        },
        body: { // Container를 등록할때 필요한 payload json 구조를 작성한다.
            "containerType": "heartbeat",
            "heartbeatPeriod": "300"
        }
    }, function(error, containerCreateResponse, body) {
        console.log('in contentInstance');
        // ********************** containerInstance에 등록을 시작한다. ***************************.
        requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt/' + AEName + '/'+ attributeName[registerCount],
            method : 'POST',
            json : true,
            headers : { // Mobius에 contentInstance등록을 위한 기본 헤더 구조
                'Accept' : 'application/json',
                'locale' : 'ko',
                'X-M2M-RI' : '12345',
                'X-M2M-Origin' : 'Origin',
                'X-M2M-NM' : 'deviceinfo', // Fiware에서 가져온 attribute이름을 사용한다.(e.g. temperature)
                'content-type' : 'application/vnd.onem2m-res+json; ty=4',
                'nmtype' : 'long'
            },
            body: { // contentInstance를 등록할때 필요한 payload json 구조를 작성한다.
                "contentInfo": type[registerCount],
                "content": value[registerCount]
            }
        }, function(error, contentInstanceResponse, body) {
            console.log("before end");
            if(contentInstanceResponse.statusCode == 201) { // 정상적으로 등록이 다 되었을 때
                console.log('AE, Container, contentInstance crease success!!');

                if(registerCount < attributeName.length - 1) {
                    registerCount++;
                    registerCallback(response, attributeName, type, value, registerFunction);
                } else {
                    registerCount = 0; // 모두 다 생성 하였으므로 초기화 한다.

                    requestToAnotherServer( { url : 'http://193.48.247.246:1026/v1/subscribeContext',
                        method : 'POST',
                        json : true,
                        headers : { // fiware접근에 필요한 기본 헤더의 구조
                            'content-type' : 'application/json',
                            'Accept' : 'application/json',
                            'Fiware-Service' : fiwareService,
                            'Fiware-ServicePath' : fiwareServicePath
                        },
                        body: { // subscription를 등록할때 필요한 payload json 구조를 작성한다.
                            "entities": [
                                {
                                    "type": "thing",
                                    "isPattern": "false",
                                    "id": "" + AEName
                                }
                            ],
                            "attributes" : attributeName,
                            "reference" : "http://218.51.23.10:62590/FiwareNotificationEndpoint", // 나중에 endpoint를 지정한다.
                            "duration" : "P1M",
                            "notifyConditions" : [
                                {
                                    "type" : "ONTIMEINTERVAL",
                                    "condValues" : [
                                        "PT15S"
                                    ]
                                }
                            ]
                        }
                    }, function(error, subscriptionResponse, body) {
                        // AE, Container, contentInstance, subscription이 다 완료되었을 때
                        response.status(201).send();
                    });
                }
            } else {
                response.status(404).send();
            }
        });
    });
};

exports.getFiwareInfo = function(response, entityName){

    AEName = entityName;
    // Fiware에 접근하여 entityName에 대한 정보를 가지고 온다.
    requestToAnotherServer( { url : 'http://193.48.247.246:1026/v1/queryContext',
        method : 'POST',
        json : true,
        headers : { // fiware접근에 필요한 기본 헤더의 구조
            'content-type' : 'application/json',
            'Accept' : 'application/json',
            'Fiware-Service' : fiwareService,
            'Fiware-ServicePath' : fiwareServicePath
        },
        body: { // NGSI10에 따른 payload이 구성이다.(queryContext)
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
            // ContextBroker에서 리턴하는 json구조에 대한 파싱을 시작한다.
            var contextResponses = body.contextResponses
            var contextElement = contextResponses[0].contextElement;
            var attributes = contextElement.attributes;

            var attributeName = [], type = [], value = []; // 특정 attribute를 저장하기위한 배열
            var count = 0;

            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].name == 'TimeInstant' || attributes[i].name == 'att_name') {
                    continue;
                } else {
                    // 리소스 등록에 필요한 데이터 파싱
                    attributeName[count] = attributes[i].name;
                    type[count] = attributes[i].type;
                    value[count] =  attributes[i].value;
                    count++;
                }
            }

            // ********************** AE에 등록을 시작한다. ***************************
            requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt',
                method : 'POST',
                json : true,
                headers : { // Mobius에 AE등록을 위한 기본 헤더 구조
                    'Accept' : 'application/json',
                    'locale' : 'ko',
                    'X-M2M-RI' : '12345',
                    'X-M2M-Origin' : 'Origin',
                    'X-M2M-NM' : AEName,
                    'content-type' : 'application/vnd.onem2m-res+json; ty=2',
                    'nmtype' : 'long'
                },
                body : { // NGSI10에 따른 payload이 구성이다.(queryContext)
                    'App-ID': "0.2.481.2.0001.001.000111"
                }
            }, function(error, AECreateResponse, body) {
                registerFunction(response, attributeName, type, value, registerFunction);
            });
        }
    });
};