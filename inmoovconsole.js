// TODO. Si al intentar conectarnos al server no hay conexion o da error de certificado no hace nada. Hay que controlar el error
// Incluir licencias de cada software usado (como i18next.com)

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
    ["cfg_lefthand_ringfinger_current_slider",0,"myInMoov.leftHand.ringfinger.moveTo"],
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
    ["cfg_righthand_ringfinger_current_slider",0,"myInMoov.rightHand.ringfinger.moveTo"],
    ["cfg_righthand_pinky_current_slider",0,"myInMoov.rightHand.pinky.moveTo"]
];

var commandHistory=[];
var commandHistoryIndex;
var ignoreInputKeyPress=false;
var consoleVersion="0.1";

function updateServoPos()
{
    for (n=0; n<movementSliderControl.length;n++)
    {
        newVal=$("#"+movementSliderControl[n][0]).slider("value");
        prevVal=movementSliderControl[n][1];
        if (prevVal!=newVal)
        {
            movementSliderControl[n][1]=newVal;
            cmd=movementSliderControl[n][2]+"("+newVal+")";
            //alert(cmd);
            consoleSendCommand("runpythoncmd", cmd, false, false, null);
        }
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
  
    for (n=0; n<movementSliderControl.length;n++)
    {
        val=$("#"+movementSliderControl[n][0]).slider("value");
        movementSliderControl[n][1]=val;
    }

    $("#cfg_radio_bodypart").buttonset();
    $("#cfg_radio_bodypart input[type=radio]").change(function() {
        changeServoSlidersPanel();
    });
    
    $("refresh_servo_sliders_button").button();
    
    $("rest_button").button();
    $("rest_button").click(function() {consoleSendCommand("runpythoncmd", "myInMoov.rest()", true, false, function(){consoleSendCommand("getservopositions", "", false, false, refreshServoSlidersFromServerCallback1);});});
    
    $("clear_console_button").button();
    $("clear_console_button").click(function() {$("#console_text").empty();});
    
    $("connect_button").button();
    $("connect_button").click(function() {consoleSendCommand("getserverstatus", "", false, false, connectToServerCallback);});
    
    i18n.init({ fallbackLng: 'es-ES' , detectLngQS: 'lang'}, function(err, t)
    {
        $("span").i18n();
        $("label").i18n();

        $("refresh_servo_sliders_button").button('option', 'label', t('buttons.refresh_servos'));
        $("rest_button").button('option', 'label', t('buttons.rest'));
        $("clear_console_button").button('option', 'label', t('buttons.clear_console'));
        $("connect_button").button('option', 'label', t('buttons.connect_to_server'));
        $("#cfg_radio_bodypart_leftarm").button('option', 'label', t('servos.leftarm'));
        $("#cfg_radio_bodypart_head").button('option', 'label', t('servos.head'));
        $("#cfg_radio_bodypart_rightarm").button('option', 'label', t('servos.rightarm'));
        
        $("refresh_servo_sliders_button").click(function() {$("#console_text").append("<span style='color: blue'>"+i18n.t("info_console.refreshing_servos")+"</span><br>");$("#console_text").scrollTop($("#console_text")[0].scrollHeight);consoleSendCommand("getservopositions", "", false, false, refreshServoSlidersFromServerCallback1);});
    
    });
  
  
   }

function startVoiceRecognition(event)
{
    if (recognizing)
    {
        recognition.stop();
        return;
    }
    
    final_transcript = '';
    recognition.lang = "es-ES";
    recognition.start();
    ignore_onend = false;
    $("#start_img").prop("src", 'mic-slash.gif');
    $("#console_text").append("<span style='color: blue'>"+i18n.t('info_mic.allow')+"</span><br>");
    start_timestamp = event.timeStamp;
}

function consoleSendCommand(cmd, pars, writeToConsole, setConsoleFocus, callback)
{
    if (writeToConsole)
    {
        $("#console_text").append(">> "+pars+"<br>");
        $("#console_text").scrollTop($("#console_text")[0].scrollHeight);
        commandHistory.push(pars);
        if (commandHistory.length>100) commandHistory.shift();
        commandHistoryIndex=commandHistory.length;
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

function consoleInputKeyPress()
{
    e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13')
    {
        $("#console_input").prop("disabled", true);
        $("#console_loading").show();
        consoleSendCommand("runpythoncmd",$("#console_input").val(), true, true, null);
        $("#console_input").val("");
        return false;
    }
    if (keyCode!='38' && keyCode!='40' && commandHistoryIndex<commandHistory.length) commandHistoryIndex=commandHistory.length;
}

function consoleInputKeyDown()
{
    e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '38' || keyCode=='40')
    {
        if (!ignoreInputKeyPress)
        {
            ignoreInputKeyPress=true;
            if (keyCode=='38' && --commandHistoryIndex<0) commandHistoryIndex=0;
            if (keyCode=='40' && ++commandHistoryIndex>commandHistory.length) commandHistoryIndex=commandHistory.length;
            $("#console_input").val(commandHistory[commandHistoryIndex]);
            setTimeout(function(){ignoreInputKeyPress=false},1);
            return false;
        }
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
//        alert(index+": "+servoStatus[index]);
        if (servoStatus[index]==true)
        {
            $("#check_"+index).attr("checked", "checked");
            //alert(index+" a true");
        }
        else
        {
            $("#check_"+index).removeAttr("checked", "checked");
            //alert(index+" a false");
        }
        clickEnableSliders($("#check_"+index)[0], false);
    }
    $("#console_text").append("<span style='color: blue'>"+i18n.t("info_console.refreshing_servos_ok")+"</span><br>");
    $("#console_text").scrollTop($("#console_text")[0].scrollHeight);
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
        $("#console_text").append("<span style='color: blue'>"+i18n.t("info_console.welcome")+": "+consoleVersion+"</span><br>");
        $("#console_text").append("<span style='color: blue'>"+i18n.t("info_console.connected")+": "+$("#cfg_inmoovbrain_server").val()+"</span><br>");
        $("#console_text").append("<span style='color: blue'>"+i18n.t("info_console.refreshing_servos")+"</span><br>");
        $("#console_text").scrollTop($("#console_text")[0].scrollHeight);
        consoleSendCommand("getservopositions", "", false, false, refreshServoSlidersFromServerCallback1);
        $("#console_connect_screen").hide();
        $("#console_content").show();
        setInterval(updateServoPos, 50);
        initSpeechRecognition();
    }
    else
        alert("No se ha podido conectar con el servidor. Verifique la URL y que el mismo esté respondiendo");
}

function initSpeechRecognition()
{
    if (!('webkitSpeechRecognition' in window))
    {
        $("#console_text").append("<span style='color: red'>"+i18n.t('info_mic.upgrade')+"</span><br>");
        $("#console_text").scrollTop($("#console_text")[0].scrollHeight);
        return;
    }
    
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = function()
    {
        recognizing = true;
        $("#console_text").append("<span style='color: blue'>"+i18n.t('info_mic.speak_now')+"</span><br>");
        $("#console_text").scrollTop($("#console_text")[0].scrollHeight);
        $("#start_img").prop("src",'mic-animate.gif');
    };
    
    recognition.onerror = function(event)
    {
        if (event.error == 'no-speech')
        {
            $("#start_img").prop("src",'mic.gif');
            $("#console_text").append("<span style='color: red'>"+i18n.t('info_mic.no_speech')+"</span><br>");
            ignore_onend = true;
        }
        else if (event.error == 'audio-capture')
        {
            $("#start_img").prop("src",'mic.gif');
            $("#console_text").append("<span style='color: red'>"+i18n.t('info_mic.no_microphone')+"</span><br>");
            ignore_onend = true;
        }
        else if (event.error == 'not-allowed')
        {
            if (event.timeStamp - start_timestamp < 100)
            {
                $("#console_text").append("<span style='color: red'>"+i18n.t('info_mic.blocked')+"</span><br>");
            }
            else
            {
                $("#console_text").append("<span style='color: red'>"+i18n.t('info_mic.denied')+"</span><br>");
            }
            ignore_onend = true;
        }
        else
        {
            $("#start_img").prop("src",'mic.gif');
            $("#console_text").append("<span style='color: red'>"+i18n.t('info_mic.error')+"</span><br>");
            ignore_onend = true;
        }
        $("#console_text").scrollTop($("#console_text")[0].scrollHeight);
    };
    
    recognition.onend = function()
    {
        recognizing = false;
        if (ignore_onend) return;
        
        $("#start_img").prop("src", 'mic.gif');
        if (!final_transcript) return;
    };
    
    recognition.onresult = function(event)
    {
        var isFinal=false;
        var interim_transcript = '';
        for (var i = event.resultIndex; i < event.results.length; ++i)
        {
            if (event.results[i].isFinal)
            {
                isFinal=true;
                final_transcript += event.results[i][0].transcript;
            }
            else
            {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        
        if (isFinal)
        {
            //$("#console_input").val("MyInMoov.voiceCommand(\""+final_transcript+"\")");
            //$("#console_input").focus();
            consoleSendCommand("runpythoncmd","myInMoov.voiceCommand(\""+final_transcript+"\")", true, false, null);
        }
    };
}

$(document).ready(function(){init();});

