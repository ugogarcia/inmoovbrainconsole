var final_transcript = '';
var recognizing = false;
var ignore_onend;
var start_timestamp;
var recognition;
var movementSliderControl=
[
    ["cfg_leftarm_omoplate_current_slider",0,"myInMoov.leftArm.omoplate.moveTo"],
    ["cfg_leftarm_shoulder_current_slider",0,"myInMoov.leftArm.shoulder.moveTo"],
    ["cfg_leftarm_rotate_current_slider",0,"myInMoov.leftArm.rotate.moveTo"],
    ["cfg_leftarm_bicep_current_slider",0,"myInMoov.leftArm.bicep.moveTo"],
    ["cfg_lefthand_wrist_current_slider",0,"myInMoov.leftHand.wrist.moveTo"],
    ["cfg_lefthand_thumb_current_slider",0,"myInMoov.leftHand.thumb.moveTo"],
    ["cfg_lefthand_index_current_slider",0,"myInMoov.leftHand.index.moveTo"],
    ["cfg_lefthand_majeure_current_slider",0,"myInMoov.leftHand.majeure.moveTo"],
    ["cfg_lefthand_ringfinger_current_slider",0,"myInMoov.leftHand.ringFinger.moveTo"],
    ["cfg_lefthand_pinky_current_slider",0,"myInMoov.leftHand.pinky.moveTo"],
    ["cfg_head_neck_current_slider",0,"myInMoov.head.neck.moveTo"],
    ["cfg_head_rotate_current_slider",0,"myInMoov.head.rotate.moveTo"],
    ["cfg_head_eyex_current_slider",0,"myInMoov.head.eyeX.moveTo"],
    ["cfg_head_eyey_current_slider",0,"myInMoov.head.eyeY.moveTo"],
    ["cfg_head_jaw_current_slider",0,"myInMoov.head.jaw.moveTo"],
    ["cfg_rightarm_omoplate_current_slider",0,"myInMoov.rightArm.omoplate.moveTo"],
    ["cfg_rightarm_shoulder_current_slider",0,"myInMoov.rightArm.shoulder.moveTo"],
    ["cfg_rightarm_rotate_current_slider",0,"myInMoov.rightArm.rotate.moveTo"],
    ["cfg_rightarm_bicep_current_slider",0,"myInMoov.rightArm.bicep.moveTo"],
    ["cfg_righthand_wrist_current_slider",0,"myInMoov.rightHand.wrist.moveTo"],
    ["cfg_righthand_thumb_current_slider",0,"myInMoov.rightHand.thumb.moveTo"],
    ["cfg_righthand_index_current_slider",0,"myInMoov.rightHand.index.moveTo"],
    ["cfg_righthand_majeure_current_slider",0,"myInMoov.rightHand.majeure.moveTo"],
    ["cfg_righthand_ringfinger_current_slider",0,"myInMoov.rightHand.ringFinger.moveTo"],
    ["cfg_righthand_pinky_current_slider",0,"myInMoov.rightHand.pinky.moveTo"]
];

var consoleVersion="0.1";

function updateServoPos()
{
    //newVal=$("#"+movementSliderControl[n][0]).slider("value");
    //alert(newVal);
    //return 1;
    
    for (n=0; n<movementSliderControl.length;n++)
    {
        newVal=$("#"+movementSliderControl[n][0]).slider("value");
        prevVal=movementSliderControl[n][1];
        if (prevVal!=newVal)
        {
            movementSliderControl[n][1]=newVal;
            cmd=movementSliderControl[n][2]+"("+newVal+")";
            //alert(cmd);
            consoleSendCommand("runpythoncmd", cmd, true, false, null);
        }
    }
}

function initMovementSliderControl()
{
    for (n=0; n<movementSliderControl.length;n++)
    {
        val=$("#"+movementSliderControl[n][0]).slider("value");
        movementSliderControl[n][1]=val;
    }

}

function init()
{
    for (n=0; n<movementSliderControl.length;n++)
    {
        $("#"+movementSliderControl[n][0]).slider({
            min:0,
            max:180,
            value:90,
            change: function( event, ui ) {sliderServoPosChange(ui);}
        });
    }
    
    $("#cfg_radio_bodypart").buttonset();
    $("#cfg_radio_bodypart input[type=radio]").change(function() {
        changeServoSlidersPanel();
    });
    
    $("refresh_servo_sliders_button").button();
    $("refresh_servo_sliders_button").click(function() {$("#console_text").append("<span style='color: blue'>Actualizando estado de los servos...</span><br>");consoleSendCommand("getservopositions", "", false, false, refreshServoSlidersFromServerCallback1);});
    
    $("rest_button").button();
    $("rest_button").click(function() {consoleSendCommand("runpythoncmd", "myInMoov.rest()", true, false, null);});
    
    $("clear_console_button").button();
    $("clear_console_button").click(function() {$("#console_text").empty();});
    
    $("connect_button").button();
    $("connect_button").click(function() {consoleSendCommand("getserverstatus", "", false, false, connectToServerCallback);});

    showInfo('info_start');
    
    if (!('webkitSpeechRecognition' in window)) {
        upgrade();
        return;
    }
    
    start_button.style.display = 'inline-block';
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = function() {
        recognizing = true;
        showInfo('info_speak_now');
        start_img.src = 'mic-animate.gif';
    };
    
    recognition.onerror = function(event) {
        if (event.error == 'no-speech') {
            start_img.src = 'mic.gif';
            showInfo('info_no_speech');
            ignore_onend = true;
        }
        if (event.error == 'audio-capture') {
            start_img.src = 'mic.gif';
            showInfo('info_no_microphone');
            ignore_onend = true;
        }
        if (event.error == 'not-allowed') {
            if (event.timeStamp - start_timestamp < 100) {
                showInfo('info_blocked');
            } else {
                showInfo('info_denied');
            }
            ignore_onend = true;
        }
    };
    
    recognition.onend = function() {
        recognizing = false;
        if (ignore_onend) {
            return;
        }
        start_img.src = 'mic.gif';
        if (!final_transcript) {
            showInfo('info_start');
            return;
        }
        showInfo('');
    };
    
    recognition.onresult = function(event) {
        var isFinal=false;
        var interim_transcript = '';
        for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                isFinal=true;
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        final_transcript = final_transcript.toLowerCase();
        final_span.innerHTML = linebreak(final_transcript);
        interim_span.innerHTML = linebreak(interim_transcript);
        
        if (isFinal)
        {
            //$("#console_input").val("MyInMoov.voiceCommand(\""+final_transcript+"\")");
            //$("#console_input").focus();
            consoleSendCommand("runpythoncmd","myInMoov.voiceCommand(\""+final_transcript+"\")", true, false, null);
            showInfo('info_sending_speech');
        }
    };
    
    initMovementSliderControl();
    setInterval(updateServoPos, 50);
    $("#console_text").append("<span style='color: blue'>InMoovBrain Console. Versión: "+consoleVersion+"</span><br>");
}

function upgrade() {
    start_button.style.visibility = 'hidden';
    showInfo('info_upgrade');
}

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
    return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
    return s.replace(first_char, function(m) { return m.toUpperCase(); });
}

function startButton(event) {
    if (recognizing) {
        recognition.stop();
        return;
    }
    final_transcript = '';
    recognition.lang = "es-ES";
    recognition.start();
    ignore_onend = false;
    final_span.innerHTML = '';
    interim_span.innerHTML = '';
    start_img.src = 'mic-slash.gif';
    showInfo('info_allow');
    start_timestamp = event.timeStamp;
}

function showInfo(s) {
    var info=document.getElementById("info");
    if (s) {
        for (var child = info.firstChild; child; child = child.nextSibling) {
            if (child.style) {
                child.style.display = child.id == s ? 'inline' : 'none';
            }
        }
        info.style.visibility = 'visible';
    } else {
        info.style.visibility = 'hidden';
    }
}

function consoleSendCommand(cmd, pars, writeToConsole, setConsoleFocus, callback) {
    if (writeToConsole)
    {
        $("#console_text").append(">> "+pars+"<br>");
        $("#console_text").scrollTop($("#console_text")[0].scrollHeight);
    }
    
    $.ajax({
           
           // The 'type' property sets the HTTP method.
           // A value of 'PUT' or 'DELETE' will trigger a preflight request.
           type: 'GET',
           
           // The URL to make the request to.
           url: $("#cfg_inmoovbrain_server").val()+"/"+cmd+"/"+pars,
           
           // The 'contentType' property sets the 'Content-Type' header.
           // The JQuery default for this property is
           // 'application/x-www-form-urlencoded; charset=UTF-8', which does not trigger
           // a preflight. If you set this value to anything other than
           // application/x-www-form-urlencoded, multipart/form-data, or text/plain,
           // you will trigger a preflight request.
           contentType: 'text/plain',
           
           xhrFields: {
           // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
           // This can be used to set the 'withCredentials' property.
           // Set the value to 'true' if you'd like to pass cookies to the server.
           // If this is enabled, your server must respond with the header
           // 'Access-Control-Allow-Credentials: true'.
           withCredentials: false
           },
           
           headers: {
           // Set any custom headers here.
           // If you set any non-simple headers, your server must include these
           // headers in the 'Access-Control-Allow-Headers' response header.
           },
           
           success: function(data) {
           // Here's where you handle a successful response.
           if (writeToConsole)
           {
                $("#console_text").append(data+"<br><br>");
                $("#console_input").prop("disabled", false);
                $("#console_loading").hide();
                $("#console_text").scrollTop($("#console_text")[0].scrollHeight);
           }
           if (setConsoleFocus) $("#console_input").focus();
           if (callback!=null) callback(data);
           },
           
           error: function() {
           // Here's where you handle an error response.
           // Note that if the error was due to a CORS issue,
           // this function will still fire, but there won't be any additional
           // information about the error.
           }
           });
}

function consoleInputKeyPress() {
    e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
        $("#console_input").prop("disabled", true);
        $("#console_loading").show();
        consoleSendCommand("runpythoncmd",$("#console_input").val(), true, true, null);
        $("#console_input").val("");
        return false;
    }
}

function sliderServoPosChange (ui)
{
    ui_name=ui.handle.parentElement.id;
    ui_name=ui_name.substr(0,ui_name.lastIndexOf("_"));
    $("#"+ui_name+"_value").val($("#"+ui_name+"_slider").slider("value"));
}

function servoPosValueChange (ui_name)
{
    $("#"+ui_name+"_slider").slider("value",$("#"+ui_name+"_value").val());
}

function changeServoSlidersPanel()
{
    selected=$("#cfg_radio_bodypart :radio:checked").attr('id');
    selected=selected.substr(selected.lastIndexOf("_"));
    
    $("#servo_sliders_head").hide();
    $("#servo_sliders_leftarm").hide();
    $("#servo_sliders_rightarm").hide();
    $("#servo_sliders"+selected).show();
}

function refreshServoSlidersFromServerCallback1(data)
{
    servoPositions=JSON.parse(data);
    for (var index in servoPositions)
    {
        $("#cfg_"+index+"_current_slider").slider("value",servoPositions[index]);
        $("#cfg_"+index+"_current_value").val(servoPositions[index]);
    }
    
    for (n=0; n<movementSliderControl.length;n++)
    {
        newVal=$("#"+movementSliderControl[n][0]).slider("value");
        movementSliderControl[n][1]=newVal;
    }
    consoleSendCommand("getservostatus", "", false, false, refreshServoSlidersFromServerCallback2);
}

function refreshServoSlidersFromServerCallback2(data)
{
    servoStatus=JSON.parse(data);
    for (var index in servoStatus)
    {
        if (servoStatus[index]=="True")
            $("#check_"+index).attr("checked", "checked");
        else
            $("#check_"+index).removeAttr("checked", "checked");
        clickEnableSliders($("#check_"+index)[0], false);
    }
    $("#console_text").append("<span style='color: blue'>Actualización del estado de los servos OK</span><br>");
}

function clickEnableSliders(cb, sendCommand)
{
    if (cb.checked)
    {
        if (sendCommand) consoleSendCommand("runpythoncmd","myInMoov."+cb.value+".attach()", true, false, null);
        //$("[id^=cfg_"+cb.value.toLowerCase()+"]").show();
        $("[id^=cfg_"+cb.value.toLowerCase()+"]").removeAttr('disabled','disabled');
        $("[id^=cfg_"+cb.value.toLowerCase()+"][id$=current_slider]").slider( "option", "disabled", false);
        $("[id^=cfg_"+cb.value.toLowerCase()+"][id$=_row]").css("color","black");
    }
    else
    {
        //$("[id^=cfg_"+cb.value.toLowerCase()+"]").hide();
        if (sendCommand) consoleSendCommand("runpythoncmd","myInMoov."+cb.value+".detach()", true, false, null);
        $("[id^=cfg_"+cb.value.toLowerCase()+"]").attr('disabled','disabled');
        $("[id^=cfg_"+cb.value.toLowerCase()+"][id$=current_slider]").slider( "option", "disabled", true );
        $("[id^=cfg_"+cb.value.toLowerCase()+"][id$=_row]").css("color","#E0E0E0");
    }
    
}

function connectToServerCallback(data)
{
    serverStatus=JSON.parse(data);
    isRunning=false;
    version="";
    
    for (var index in serverStatus)
    {
        if (index=="status")
            isRunning=serverStatus[index]=="running"
        
        if (index=="version")
            version=serverStatus[index]
    }

    if (isRunning && version!="")
    {
        $("#console_text").append("<span style='color: blue'>Conectado al servidor en la URL: "+$("#cfg_inmoovbrain_server").val()+" (versión "+version+")</span><br>");
        $("#console_text").append("<span style='color: blue'>Actualizando estado de los servos...</span><br>");
        consoleSendCommand("getservopositions", "", false, false, refreshServoSlidersFromServerCallback1);
        $("#console_connect_screen").hide();
        $("#console_content").show();

    }
    else
        alert("No se ha podido conectar con el servidor. Verifique la URL y que el mismo esté respondiendo");
}

$(document).ready(function(){init();});

