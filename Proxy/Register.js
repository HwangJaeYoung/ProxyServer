/**
 * Created by HwangJaeYoung on 2015-10-11.
 */

// extract the modules
var mysql = require('mysql');
var requestToAnotherServer = require('request');
var async = require('async');
var dbConfig = require('./DatabaseConfig');

global.AEName = ''; // 공통적으로 사용하는 AE를 정의한다.

// AE를 생성한 후에 여러개의 attribute들이 있을 수 있는데 반복적으로 정의하기 위한 함수이다.
var requestFunction = function(response, attributeName, type, value) {

    console.log('values : ' + attributeName + ', ' + type + ', ' + value);
    // ********************** Container에 등록을 시작한다. ***************************s
    requestToAnotherServer( { url : 'http://210.107.239.106:7579/mobius-yt/' + AEName,
        method : 'POST',
        json : true,
        headers : { // Mobius에 Container 등록을 위한 기본 헤더 구조
            'Accept' : 'application/json',
            'locale' : 'ko',
            'X-M2M-RI' : '12345',
            'X-M2M-Origin' : 'Origin',
            'X-M2M-NM' : '' + attributeName, // Fiware에서 가져온 attribute이름을 사용한다.(e.g. temperature)
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
        requestToAnotherServer( { url : 'http://210.107.239.106:7579/mobius-yt/' + AEName + '/'+ attributeName,
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
                "contentInfo": type,
                "content": value
            }
        }, function(error, contentInstanceResponse, body) {
            if(contentInstanceResponse.statusCode == 201) { // 정상적으로 등록이 다 되었을 때
                console.log('AE, Container, contentInstance crease success!!');
                response.status(201).send();
            } else
                response.status(404).send();
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
            'Fiware-ServicePat2h' : fiwareServicePath
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

            requestToAnotherServer( { url : 'http://http://193.48.247.246:1026/v1/subscribeContext',
                method : 'POST',
                json : true,
                headers : { // fiware접근에 필요한 기본 헤더의 구조
                    'content-type' : 'application/json',
                    'Accept' : 'application/json',
                    'Fiware-Service' : fiwareService,
                    'Fiware-ServicePat2h' : fiwareServicePath
                },
                body: { // subscription를 등록할때 필요한 payload json 구조를 작성한다.
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
                    "reference" : "http://ProxyServer/FiwareNotificationEndpoint", // 나중에 endpoint를 지정한다.
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
                // ********************** AE에 등록을 시작한다. ***************************
                requestToAnotherServer( { url : 'http://210.107.239.106:7579/mobius-yt',
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
                    var registerCount = 0;

                    // attributes를 동시에 저장하기 위한 동기화가 필요하다.
                    async.whilst(function( ) {
                            // 탈출조건 저장할 attribute의 갯수를 확인하여 갯수만큼 저장한다.
                            return registerCount < attributeName.length;
                        },

                        function (dummyCallback) { // dummyCallback은 사용하는 함수가 아니다.
                            console.log('in async');
                            // 반복적으로 저장하기 위해 호출한다. 한 번 호출이 끝나면  registerCount검사를 동기적으로 검사하여 실행한다.
                            requestFunction(response, attributeName[registerCount], type[registerCount], value[registerCount]);
                            registerCount++;
                            setTimeout(dummyCallback, 1000); // 1초 주기로 해당함수를 실행한다.
                        },
                        function (err) { // 중간에 에러가 발생하거나 탈출조건 확인후 정상적으로 끝났을 때
                            console.log("End");
                        }
                    )
                });
            });
        }
    });
};