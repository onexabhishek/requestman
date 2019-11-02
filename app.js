const express = require('express');
const electron = require('electron');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const route = express();
const datetime = require('node-datetime');

const setCookie = require('set-cookie-parser');
//Start beautifiers
const beautify_html = require('js-beautify').html;
const beautify_xml = require('xml-formatter');
const beautify_json = require('json-format');
// const $ = require('jquery');

//End of beautifier
const { app, BrowserWindow } = electron;

route.use(express.static(path.join(__dirname,'public')));

route.set('views',path.join(__dirname,'views'));
route.set('view engine','pug');

// parse application/x-www-form-urlencoded
route.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
route.use(bodyParser.json())


let win;

function createWindow(){
	win = new BrowserWindow({
	    width: 800,
	    height: 600,
	    webPreferences: {
	      nodeIntegration: true
	    }
  });

	win.loadURL('http://localhost:3000/');
}
app.on('ready',createWindow);


route.get('/',(req,res)=>{
	res.render('index');
})
route.get('/httpRequest/:id',(req,res)=>{
	const data = axios({
		method:'GET',
		url:'https://obrazo.com/appapi/allgets',
	}).then(response=>{
		res.json(response.data);
	})
})
route.post('/httpRequest',(req,res)=>{
	let start = datetime.create()._created;
	const data = axios({
		method:req.body.method,
		url:req.body.url,
        timeout: 40000,
        withCredentials:true
	}).then(response=>{
	let responseTime = datetime.create()._created - start;
		var cookies = setCookie.parse(response,{
		decodeValues:true
	});
	res.send({headers:response.headers,
		body:response.data,
		status:response.status,
		statusCode:response.statusText,
		responseTime:responseTime,
		cookies:cookies,
		responseConfig:response.config
	});
	}).catch(err => { 
	let responseTime = datetime.create()._created - start;
	var cookies = setCookie.parse(err,{
		decodeValues:true
	});
		res.json({headers:err.response.headers,
		body:err.response.data,
		status:err.response.status,
		statusCode:err.response.statusText,
		responseTime:responseTime,
		cookies:cookies,
		responseConfig:err.response.config
	});

	 })

})
route.post('/beautify',(req,res)=>{
	let data = req.body.data;
	let responseType = req.body.dataType;
	let beautified_data = '';
	if(responseType == 'html'){
		beautified_data = beautify_html(data);
	}else if(responseType == 'json'){
		// beautified_data = beautify_json(data);
		beautified_data = JSON.stringify(data,null,4);
	}else if(responseType == 'xml'){
		beautified_data = beautify_xml(data);
	}
	res.send(beautified_data);
})

route.listen(3000,(err)=>{
	if(err){
		console.log(err);
	}
	console.log('Express is listening at 3000');
});