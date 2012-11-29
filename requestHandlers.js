var url = require('url');
var http = require('http');
var https = require('https');

/*
var exec = require("child_process").exec,
    querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable"),
    mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db;
    */

function start(response, request) {
    console.log("Request handler 'start' was called.");

    var body = '<html>'+
      '<head>'+
      '<meta http-equiv="Content-Type" '+
      'content="text/html; charset=UTF-8" />'+
      '<title>Asana Charts</title>'+
      '</head>'+
      '<body>'+
      '<form action="/getWorkspaces" method="get">'+
      'API Key: '+
      '<input type="text" name="apiKey"> <br/>'+
      '<input type="submit" value="Submit">'+
      '</form>'+
      '</body>'+
      '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function getWorkspaces(response, request) {
  queryData = url.parse(request.url, true).query;
  apiKey = queryData.apiKey;

  if (!queryData.apiKey) {
    response.write("Invalid API Key");
    response.end();
    return;
  }

  console.log("Received request with API key: " + apiKey);

  var options = {
    host: 'app.asana.com',
    path: '/api/1.0/users/me',
    auth: apiKey + ':',
    method: 'GET'
  };

  callback = function(serverResponse) {
    var str = ''
    serverResponse.on('data', function (chunk) {
      str += chunk;
      console.log(str);
    });

    serverResponse.on('end', function () {

      html = getWorkspaceListHtml(str, apiKey);

      response.writeHead(200, {"Content-Type": "text/html"});
      response.write(html);
      response.end();

    });
  }

  console.log("Sending API request for user with key: " + apiKey);
  var req = https.request(options, callback);
  req.end()

}

function getWorkspaceListHtml(userInfo, apiKey) {
  console.log("parsing API reponse");
  workspaces = JSON.parse(userInfo).data.workspaces;

  workspaceInput = '';

  for (var i = 0; i < workspaces.length; i++) {
    workspaceName = workspaces[i].name;
    workspaceId = workspaces[i].id;
    workspaceInput += '<input type="radio" name="workspaceId" value="' + workspaceId + '"/> ' +
      workspaceName + '</br>';
  }

  var html = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '<title>Asana Charts</title>'+
    '</head>'+
    '<body>'+
    '<form action="/render" method="get">'+
    workspaceInput +
    '<input type="hidden" name="apiKey" value="' + apiKey+ '"/>' +
    '<input type="submit" value="Render Stats"/>'+
    '</form>'+
    '</body>'+
    '</html>';

  return html;

}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 9; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

exports.start = start;
exports.getWorkspaces = getWorkspaces;
