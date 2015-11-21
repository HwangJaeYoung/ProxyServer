/**
 * Created by HwangJaeYoung on 2015-11-07.
 * forest62590@gmail.com
 */

var infinite = function( ) {
    while(1) { }
}

for(var i = 0; i < 3; i++) {
    console.log("in function");
    setTimeout(function(){
        console.log(i);
    }, 0);

    infinite( );
    /* infinite( )를 호출하면 내부에서 무한루프를 돌게 되고
    결과적으로 infinite( ) 함수가 끝나지 않으므로 setTimeout에서
    delayTime이 0이라고해도 infinite( )의 종료를 기다리므로
    setTimeout의 function은 실행되지 않는다. */
}