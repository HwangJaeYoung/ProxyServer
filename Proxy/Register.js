/**
 * Created by HwangJaeYoung on 2015-10-11.
 * forest62590@gmail.com
 */

// extract the modules
var requestToAnotherServer = require('request');
var AEName = ''; // ���������� ����ϴ� AE�� �����Ѵ�.
var AEType = ''; // ���������� ����ϴ� AE Type�� �����Ѵ�.
var AECount = 0; // �����Ǵ� AE�� ������ Ȯ���ϱ� ���Ͽ� ����Ѵ�.
var registerCount = 0;  // attribute ����� ������ ī��Ʈ �Ѵ�.
var subscriptionCount = 0; // ContextBroker�� Subscription�� ��û�� �� ������ Ȯ���ϱ� ���Ͽ� ����Ѵ�.

// AE�� ������ �Ŀ� �������� attribute���� ���� �� �ִµ� �ݺ������� �����ϱ� ���� �Լ��̴�.
var registerFunction = function(attributeName, type, value, registerCallback, aeCreateCallback, fiwareInfo) {
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
                    // ���� ��ϵ��� ���� attribute���� �����Ƿ� registerCallback �Լ��� �̿��Ͽ� ������ attribute���� ����Ѵ�.
                    registerCallback(attributeName, type, value, registerFunction, aeCreateCallback, fiwareInfo);
                } else {
                    registerCount = 0; // ��� �� ���� �Ͽ����Ƿ� �ʱ�ȭ �Ѵ�.

                    // ���� ��ϵ��� ���� Entity(AE)�� �����Ƿ� aeCreateCallback �Լ��� �ٽ� ȣ���Ѵ�.
                    if(AECount < fiwareInfo.getEntityNameLength( ) - 1) {
                        AECount++;
                        aeCreateCallback(fiwareInfo);
                    } else { // ��� AE�� ����� �Ǿ��� �� �����ϴ� �κ�
                        console.log('*****************************************')
                        console.log("********** All Entity Created ***********");
                        console.log('*****************************************')

                        if(subscriptionActive == '1') {
                            // ��� AE�� ����� ������ ���� �� Entity�� ���� Subscription�� ContextBroker�� ��û�Ѵ�.
                            subscriptionToContextBroker(fiwareInfo); // ����� EntityID����� �Ű������� �Ѱ��ش�.
                        }
                    }
                }
            } else if (contentInstanceResponse.statusCode == 409) { // �̹� ���� ������ ������ ���� ����Ѵ�.
                if(registerCount < attributeName.length - 1) {
                    registerCount++;
                    // ���� ��ϵ��� ���� attribute���� �����Ƿ� registerCallback �Լ��� �̿��Ͽ� ������ attribute���� ����Ѵ�.
                    registerCallback(attributeName, type, value, registerFunction, aeCreateCallback, fiwareInfo);
                }
            } else { // contentInstance�� ����� �����Ͽ����� �����ϴ� �κ� �ַ� 409 ������ �߻���Ų��.
                registerFunction(attributeName, type, value, registerCallback, aeCreateCallback, fiwareInfo);
            }
        });
    });
};

var subscriptionToContextBroker = function (fiwareInfo, conflict) {

    var entityName = fiwareInfo.getEntityName( );
    var entityType = fiwareInfo.getEntityType( );

    var AEName = entityName[subscriptionCount];
    var AEType = entityType[subscriptionCount];

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
                        "type": AEType,
                        "isPattern": "false",
                        "id": "" + AEName
                    }
                ]
            }
        }, function (error, fiwareResponse, body) {
            if (fiwareResponse.statusCode == 200) {
                // ContextBroker���� �����ϴ� json������ ���� �Ľ��� �����Ѵ�.
                var contextResponses = body.contextResponses
                var contextElement = contextResponses[0].contextElement;
                var attributes = contextElement.attributes;

                var attributeName = [], type = [], value = []; // Ư�� attribute�� �����ϱ����� �迭
                var count = 0;

                for (var i = 0; i < attributes.length; i++) {
                    var attrName = attributes[i].name;
                    var subString = attrName.substring(attrName.length - 6, attrName.length);

                    if (attributes[i].name == 'TimeInstant' || attributes[i].name == 'att_name' || subString == 'status') {
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
                                "type": AEType,
                                "isPattern": "false",
                                "id": "" + AEName
                            }
                        ],
                        "attributes": attributeName,
                        "reference": proxyIP + ':' + proxyPort + '/FiwareNotificationEndpoint', // ���߿� endpoint�� �����Ѵ�.
                        "duration": "P1M",
                        "notifyConditions": [
                            {
                                "type": "ONTIMEINTERVAL",
                                "condValues": [
                                    "PT1S"
                                    // Fiware���� notification �ϴ� �ֱ⸦ �����Ѵ�. PT15S�� 15�� ���� Fiware���� Fi-Proxy�� ������ �Ѵ�.
                                    // PT1S�� �ٲٸ� 1�ʸ��� ���޵ȴ�.
                                ]
                            }
                        ]
                    }
                }, function (error, subscriptionResponse, body) {
                    if(subscriptionResponse.statusCode == '200') {
                        console.log("FiwareDevice Subscription Success");

                        if(conflict == 'conflict') {
                            getFiwareInfo(fiwareInfo);
                        } else {
                            if (subscriptionCount < fiwareInfo.getEntityNameLength() - 1) {
                                // ���� Subscription ����� Entity���� ���� �����Ƿ� subscriptionToContextBroker �ݹ��Լ��� ����Ͽ� �ٽ� ����Ѵ�.
                                subscriptionCount++;
                                subscriptionToContextBroker(fiwareInfo);
                            } else {
                                // ��� Entity�� Subscription ����� ������ �� �����ϴ� �κ�.
                                console.log('*****************************************')
                                console.log("******** Subscription All Create ********");
                                console.log('*****************************************');
                            }
                        }
                    } else { // Subscription ��û�� ���� �Ͽ��� �� �ٽ� �õ��Ѵ�.
                        subscriptionToContextBroker(fiwareInfo);
                    }
                });
            } else { // Fiware�� ������ ���� ���Ͽ��� �� �ٽÿ�û�Ѵ�.
                subscriptionToContextBroker(fiwareInfo);
            }
    });
}

var getFiwareInfo = function(fiwareInfo){

    var entityName = fiwareInfo.getEntityName( );
    var entityType = fiwareInfo.getEntityType( );

    AEName = entityName[AECount];
    AEType = entityType[AECount];

    console.log('Creating..... ' + AEName + ' / ' + AEType);

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
                    "type": AEType,
                    "isPattern": "false",
                    "id": "" + AEName
                }
            ]
        }
    }, function (error, fiwareResponse, body) {
        if (fiwareResponse.statusCode == 200) {
            // ContextBroker���� �����ϴ� json������ ���� �Ľ��� �����Ѵ�.
            var contextResponses = body.contextResponses
            var contextElement = contextResponses[0].contextElement;
            var attributes = contextElement.attributes;

            var attributeName = [], type = [], value = []; // Ư�� attribute�� �����ϱ����� �迭
            var count = 0;

            for (var i = 0; i < attributes.length; i++) {
                var attrName = attributes[i].name;
                var subString = attrName.substring(attrName.length - 6, attrName.length);

                if (attributes[i].name == 'TimeInstant' || attributes[i].name == 'att_name' || subString == 'status') {
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
                if(AECreateResponse.statusCode == '201') {
                    registerFunction(attributeName, type, value, registerFunction, getFiwareInfo, fiwareInfo);
                } else if(AECreateResponse.statusCode == '409') { // �̹� ������� �������� ���� ����̽��� ����Ѵ�.
                    if(AECount < fiwareInfo.getEntityNameLength( ) - 1) {
                        AECount++;
                        getFiwareInfo(fiwareInfo);
                    } else {
                        if(subscriptionActive == '1') {
                            // ��� AE�� ����� ������ ���� �� Entity�� ���� Subscription�� ContextBroker�� ��û�Ѵ�.
                            subscriptionToContextBroker(fiwareInfo); // ����� EntityID����� �Ű������� �Ѱ��ش�.
                        }
                    }
                } else { // ��Ÿ������ ��쿡�� �ٽ� ����� ��û�Ѵ�.
                    console.log('******* Retry device registration to YellowTurtle *******');
                    registerFunction(attributeName, type, value, registerFunction, getFiwareInfo, fiwareInfo);
                }
            });
        } else { // Fiware���� �߸��� ������ �޾��� ���� �ٽ� �õ��Ѵ�.
            getFiwareInfo(fiwareInfo);
        }
    });
};

exports.fiwareDeviceRegistration = function(fiwareInfo) {
    getFiwareInfo(fiwareInfo);
}