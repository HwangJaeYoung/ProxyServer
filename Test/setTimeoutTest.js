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
    /* infinite( )�� ȣ���ϸ� ���ο��� ���ѷ����� ���� �ǰ�
    ��������� infinite( ) �Լ��� ������ �����Ƿ� setTimeout����
    delayTime�� 0�̶���ص� infinite( )�� ���Ḧ ��ٸ��Ƿ�
    setTimeout�� function�� ������� �ʴ´�. */
}