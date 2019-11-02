const uuidv1 = require('uuid/v1');
const $ = require('jquery');
const Dexie = require('dexie');
// const materialize = require('materialize-css').sidenav;
var responseData ='';

//################### Dexie JS ################//

var db = new Dexie('History');
db.version(1).stores({
  request_history:"id,url,method,created_at,headers"
})

//################## Init Materialize ############//
document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.sidenav');
  var select = document.querySelectorAll('select');
  var tabs = document.querySelectorAll('.tabs');
  // var autocomplete = document.querySelectorAll('.autocomplete');
  M.Sidenav.init(elems);
  M.FormSelect.init(select);
  M.Tabs.init(tabs);

  var elems = document.querySelectorAll('.autocomplete');
   M.Autocomplete.init(elems,{data:{
      "Apple": null,
      "Microsoft": null,
      "Adminspress":'https://pbs.twimg.com/profile_images/980816162241081344/W6NK_XgM.jpg',
      "Google": 'https://placehold.it/250x250',
      "Bing":null,
      "Facebook":null
    }});
  // var instance = M.Autocomplete.getInstance(autocomplete);
  // instance.updateData();
});





//Select Element Where editor has to set
var editor = ace.edit("aceEditor");
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/html");
    // editor.setValue(data);
editor.resize();
editor.setOption("showPrintMargin", false)
// editor.setOption("showGutter", false)
    // editor.setShowFoldWidgets(false);
    // editor.setOptions({
    //     maxLines: Infinity
    // });
    editor.getSession().setUseWrapMode(true);
    // editor.setFontSize(14);
    // editor.setBehavioursEnabled(false);
    editor.renderer.setOption('showLineNumbers', true);


$(document).ready(function(){
  let user_array = [];
  let table = new Object();
  let array_type = new Object();
$('#catchRequest').on('submit',(e)=>{
  e.preventDefault();
  let userData = $('#catchRequest').serialize()+'&created_at='+moment().unix()+'&id='+uuidv1()+'&headers=init';
  db.request_history.add(parseParams(userData));
  // insertCollection('History','request_history',parseParams(userData));
  console.log(parseParams(userData));

  $.ajax({
    type:'POST',
    url:'/httpRequest',
    data:$('#catchRequest').serialize(),
    success: (success)=>{
      console.log(success);
      responseData = success;
      let data_type = responseData.headers['content-type'].substring(responseData.headers['content-type'].lastIndexOf('/')+1,responseData.headers['content-type'].lastIndexOf(';'));
      editor.setValue(($('#responseType').val() == 'json' || data_type == 'json') ? JSON.stringify(responseData.body,null,4) : responseData.body);
      // console.log(responseData.headers['content-type'].substring(responseData.headers['content-type'].lastIndexOf('/')+1,responseData.headers['content-type'].lastIndexOf(';')));
      if($('#responseType').val() == 'auto'){
        $('#responseType').val(data_type);
        // $('select').formSelect();
          M.FormSelect.init($('select'));
      }
      if(responseData.status == 200){
        $('.status_header').show().addClass('response_sucess');
      }else{
        $('.status_header').show().removeClass('response_sucess').addClass('response_danger');
      }
      $('.status').text(responseData.status+' '+responseData.statusCode);
      // $('.size').text();
      $('.timespent').text(responseData.responseTime+'ms');
      let tbody_td = '';
      let p =responseData.headers;
      let getCookie = responseData.headers['set-cookie'];
      // delete responseData.headers['set-cookie'];
      let num_header = 1;
      for (var key in p) {
        if (p.hasOwnProperty(key)) {
          num_header++;
          tbody_td +=`<tr><td>${key}</td><td>${p[key]}</td></tr>`;
        }
      }
      console.log(getCookie);
      let cookie_data = '';
      let cookie_array = responseData.cookies;
      // for (i in getCookie) {
      //   cookie_array.push(parseCookie(getCookie[i]));
      // appendItem('history','url_heat',userData+'&status='+responseData.status);
      //   // console.log(parseCookie(getCookie[0]));
      // }
      // console.log(cookie_array);
      let num_cookie = 1;
      cookie_array.forEach(cookie_item=>{
        num_cookie++;
        cookie_data +=`<tr><td>${cookie_item.name}</td><td>${cookie_item.value}</td><td>${cookie_item.path}</td><td>${cookie_item.domain}</td><td>${cookie_item.expires}</td><td>${cookie_item.HttpOnly}</td></tr>`;

      })
      // getCookie.forEach(cookie_object=>{
      //    console.log(parseCookie(cookie_object));
      // })

      $('.parse-header').html(tbody_td);
      $('.parse-cookie').html(cookie_data);
      $('#numCookies').html(num_cookie);
      $('#numHeaders').html(num_header);
      generate_history();
    },
    error:(error)=>{
      console.log(error);
    }

  })
});

$('#tidy').click(()=>{
  $.post('/beautify',{data:$('#responseType').val() == 'json' ? JSON.stringify(responseData.body,null,4) : responseData.body,dataType:$('#responseType').val()},(data)=>{
    // console.log(data);
    editor.getSession().setMode("ace/mode/"+$('#responseType').val());
    $('#responseType').val() == 'json' ? editor.setValue(JSON.parse(data)) : editor.setValue(data);
     $('.editor-container').show();
   $('.preview-window').hide();
  })
})

$('#viewRaw').click(()=>{
  editor.setValue($('#responseType').val() == 'json' ? JSON.stringify(responseData.body,null,4) : responseData.body);
  editor.getSession().setMode("ace/mode/text");
  $('.editor-container').show();
   $('.preview-window').hide();
});

$('#previewData').click(()=>{
  let iframe = document.createElement('iframe');
  // iframe.src = $('#fetchUrl').val();
  iframe.src = 'about:blank';
  iframe.frameBorder=0;
  iframe.className= 'adp-preview';
  $('.preview-window').show();
  $('.editor-container').hide();
   $('.preview-window').html(iframe);
   $('.adp-preview').contents().find('body').html(responseData.body);

})

// End of document ready
  });

function htmlEscape(val){
  let elem = document.createElement('textarea');
  elem.id = 'SpecEscap';
  elem.innerHTML = val;
  return $('#SpecEscap').val();
}






function parseCookie(cookie_object){
 let cookie = cookie_object.split(';').reduce((cookieObject, cookieString) => {
      let splitCookie = cookieString.split('=')
      try {
        cookieObject[splitCookie[0].trim()] = decodeURIComponent(splitCookie[1])
      } catch (error) {
        cookieObject[splitCookie[0].trim()] = splitCookie[1]
      }
      return cookieObject
    }, []);
 return cookie;
//   cookie_object.split(';').reduce((cookieObject, cookieString) => {
//   let splitCookie = cookieString.split('=').map((cookiePart) => { cookiePart.trim() })
//   try {
//      cookieObject[splitCookie[0]] = JSON.parse(splitCookie[1]);
//      // console.log(cookieObject);
//   } catch (error) {
//     cookieObject[splitCookie[0]] = splitCookie[1]
//   }
//   return cookieObject;
// });
}
function localFetch(key){
  if(typeof localStorage.getItem(key) != 'undefined' && localStorage.getItem(key) != '' && typeof localStorage.getItem(key) != 'object'){
    return localStorage.getItem(key);
  }else{
    console.warn('Collection for "'+key+'" Not Found');
    return false;
  }
}
function insertItem(key,value){
  return localStorage.setItem(key,value);
}
function appendItem(key,array,value){
   if(typeof localStorage.getItem(key) != 'undefined' && localStorage.getItem(key) != '' && typeof localStorage.getItem(key) != 'object'){
      let selected_data = JSON.parse(localStorage.getItem(key));
      let main_array = JSON.parse(selected_data[array]);
      main_array.push(parseParams(value));
      selected_data[array] = JSON.stringify(main_array);
      let str_array = JSON.stringify(selected_data);
      localStorage.setItem(key,str_array);
   }else{
    console.error("Item Doesn't Exist ! Try Again");
    CreateCollection(key,array,value)
   }

}
function CreateCollection(key,array,emptyObj){
   if(typeof localStorage.getItem(key) == 'undefined' || typeof localStorage.getItem(key) == 'object'){
      // let selected_data = JSON.parse(localStorage.getItem(key));
      let main_obj = {};
      let main_array = [];
      main_obj[array] =JSON.stringify(main_array);

      localStorage.setItem(key,JSON.stringify(main_obj));
      // insertItem(key);
      // localStorage.setItem(key,'sfrg');
   }else{
    console.error("Item Already Exist");
   }

}
function parseParams(query){
  var result = {};
  query.split("&").forEach(function(part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}
var url_heats;

// Used to generate Url heat history
var temp_Obj = new Object();
const generate_history = async ()=>{
  if(localFetch('history')){
    let history_obj = JSON.parse(localFetch('history'));
     // url_heats = JSON.parse(history_obj.url_heat);
    let historyRow = '';
    const oldFriends = await db.request_history.toArray();
    url_heats = oldFriends;
    console.log(url_heats);
    // var temp_Obj = new Object();
    let temp_array = new Array();
   const maped_data = url_heats.map((item)=>{
      if(typeof temp_Obj[moment.unix(item.created_at).format('MM/D/YY')] == 'undefined'){
        console.log('undefined');

        temp_Obj[moment.unix(item.created_at).format('MM/D/YY')] =  JSON.stringify(item);
      }else{
         console.log('not-undefined');
         temp_Obj[moment.unix(item.created_at).format('MM/D/YY')] +=  '%ADP%'+JSON.stringify(item);
      }
    });
   console.log(temp_Obj);
   for (var key in temp_Obj) {
        if (temp_Obj.hasOwnProperty(key)) {
          console.log(key);
          let data_r = temp_Obj[key];
          historyRow += `<div class="hdate">${moment(key).format('MMMM Do YYYY')}</div><ul class="adp-list">`;
          data_r.split('%ADP%').forEach(temp_data=>{
            // console.log(JSON.parse(temp_Obj[key]))
              historyRow += `<li><span class="hmethod">${JSON.parse(temp_data).method}</span> <a href="#">${JSON.parse(temp_data).url}</a> <span class="hdelete"><i class="material-icons">delete
          </i></span></li>`;
           
           
          })
           historyRow += '</ul>';
        }
      }
    $('.adp-list-group').html(historyRow);
  }
}

generate_history();

 // ############### Start of Request Header #############
 let randId = 1;
 $('.paramInput').on('keydown',function(){
    let paramPara = `<tr>
                      <td style="width:5%">
                        <label>
                          <input type="checkbox" name="is_checked" class="reactKey enterCheck${randId}">
                          <span></span>
                        </label>
                      </td>
                      <td>
                          <div class="input-field col s12">
                            <input name="param_key" class="paramInput reactKey enterKey${randId}" placeholder="Key" type="text"/>
                          </div>
                      </td>
                      <td>
                          <div class="input-field col s12">
                            <input name="param_value" class="reactKey paramInput enterValue${randId}" placeholder="Value" type="text"/>
                          </div>
                      </td>
                    </tr>`;
  // if($(this).val() != ''){
    // if(randId == 1){
    // $('#requestParams').prepend(paramPara);
    $(this).parents().eq(2).before(paramPara);
  // }else{
  //    $('#requestParams').append(paramPara);
  // }
    $(`.enterValue${randId}`).val($('#enterParamValue').val());
    $(`.enterKey${randId}`).val($('#enterParamKey').val());
    $(`.enterCheck${randId}`).click();
    $('.'+$(this).attr('data-rel')+randId).focus();
      $('#enterParamValue,#enterParamKey').val('');
  // }
randId++;
  console.log($(this).attr('data-rel')+randId);
  $('.reactKey').keyup(function(){
      rq_params();
  })
 })

// ####### Params ##########
function rq_params(){
 var rq_params_obj;
 var rq_params_array = [];
  $('input:checkbox').click(function(){
    console.log($(this).val());
    if($(this).val() == 'on'){
      $(this).val('off');
    }else{
       $(this).val('on');
    }
  });

  for (let i=1;i<randId;i++) {
    rq_params_array.push({key:$('.enterKey'+i).val(),value:$('.enterValue'+i).val(),status:$('.enterCheck'+i).val()});
  }
  // rq_params_obj = $('.req-params').serialize();
  console.log(rq_params_array);
  rq_url(rq_params_array);

}
function rq_url(paramsObj){
  let params_url_encoded = '';
  paramsObj.forEach(paramObj=>{
    if(paramObj.status == 'on'){
      params_url_encoded == '' ? params_url_encoded = paramObj.key+'='+paramObj.value : params_url_encoded += '&'+paramObj.key+'='+paramObj.value;
    }
  })
  console.log(params_url_encoded);
  console.log(parseParams(params_url_encoded));
  set_req_url(params_url_encoded);

}
function set_req_url(reqUrl){
  let fetchUrl = $('#fetchUrl').val();
  if(typeof fetchUrl.split('?')[1] != 'undefined' && fetchUrl.split('?')[1] != ''){
    fetchUrlObj = parseParams(fetchUrl);
    fetchUrl += '&'+reqUrl;
    $('#fetchUrl').val(fetchUrl);
    console.log(fetchUrlObj);
  }else{
    fetchUrl += '?'+reqUrl;
    $('#fetchUrl').val(fetchUrl);
  }
}
function append_rq_param(param_obj){

}
// ############### End of Request Header #############