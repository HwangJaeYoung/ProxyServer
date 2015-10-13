/**
 * Created by HwangJaeYoung on 2015-10-11.
 */

// extract the modules
var mysql = require('mysql');
var requestToAnotherServer = require('request');
var dbConfig = require('./DatabaseConfig');

exports.getFiwareInfo = function(response, entityName){

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
                        "id": "" + entityName
                    }
                ]
            }
        }, function (error, responseAnotherServer, body) {
        if (!error && responseAnotherServer.statusCode == 200) {
            // ContextBroker에서 리턴하는 json구조에 대한 파싱을 시작한다.
            var contextResponses = body.contextResponses
            var contextElement = contextResponses[0].contextElement;
            var attributes = contextElement.attributes;

            var entityID = contextElement.id; // ContextBroker에 전달한 EntityID
            var type = contextElement.type; // Entity의 Type을 추출

            console.log(entityID + ' : ' + type);

            var attributeName, type, value;

            // 특정 attribute를 찾아낸다 현재는 한개만 가능하다.
            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].name == 'TimeInstant') { }
                else if (attributes[i].name == 'att_name') { }
                else {
                    // 리소스 등록에 필요한 데이터 파싱
                    attributeName = attributes[i].name;
                    type = attributes[i].type;
                    value =  attributes[i].value;
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
                    'X-M2M-NM' : '' + attributeName, // Fiware에서 가져온 attribute이름을 사용한다.(e.g. temperature)
                    'content-type' : 'application/json',
                    'nmtype' : 'long'
                },
                body: { // AE를 등록할때 필요한 payload xml 구조를 작성한다.
                    'entities': [
                        {
                            "type": "thing",
                            "isPattern": "false",
                            "id": "" + entityName
                        }
                    ]
                }
            }, function(error, responseAnotherServer, body) {
                // ********************** Container에 등록을 시작한다. ***************************
                requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt',
                    method : 'POST',
                    json : true,
                    headers : { // Mobius에 AE등록을 위한 기본 헤더 구조
                        'Accept' : 'application/json',
                        'locale' : 'ko',
                        'X-M2M-RI' : '12345',
                        'X-M2M-Origin' : 'Origin',
                        'X-M2M-NM' : '' + attributeName, // Fiware에서 가져온 attribute이름을 사용한다.(e.g. temperature)
                        'content-type' : 'application/json',
                        'nmtype' : 'long'
                    },
                    body: { // AE를 등록할때 필요한 payload xml 구조를 작성한다.
                        'entities': [
                            {
                                "type": "thing",
                                "isPattern": "false",
                                "id": "" + entityName
                            }
                        ]
                    }
                }, function(error, responseAnotherServer, body) {
                    // ********************** containerInstance에 등록을 시작한다. ***************************.
                    requestToAnotherServer( { url : 'http://127.0.0.1:7579/mobius-yt',
                        method : 'POST',
                        json : true,
                        headers : { // Mobius에 AE등록을 위한 기본 헤더 구조
                            'Accept' : 'application/json',
                            'locale' : 'ko',
                            'X-M2M-RI' : '12345',
                            'X-M2M-Origin' : 'Origin',
                            'X-M2M-NM' : '' + attributeName, // Fiware에서 가져온 attribute이름을 사용한다.(e.g. temperature)
                            'content-type' : 'application/json',
                            'nmtype' : 'long'
                        },
                        body: { // AE를 등록할때 필요한 payload xml 구조를 작성한다.
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
                            // 최종적인 등록 마무리를 한다.

                        }
                    });
                });
            });
        }
    });
};