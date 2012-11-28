var url = require('url');
var http = require('http');
var https = require('https');

function render(response, request) {

  queryData = url.parse(request.url, true).query;

  apiKey = queryData.apiKey;
  workspaceId = queryData.workspaceId;
  userId = queryData.userId;

  tasks = getTasks(apiKey, workspaceId, response)


}

function getTasks(apiKey, workspaceId, response) {

  var options = {
    host: 'app.asana.com',
    path: '/api/1.0/tasks?workspace='+workspaceId+'&assignee=me',
//    path: '/api/1.0/tasks?workspace='+workspaceId,
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

      console.log(str);
      response.writeHead(200, {"Content-Type": "text/html"});
      response.write(str);
      response.end();

    });
  }

  console.log("Sending API request");
  var req = https.request(options, callback);
  req.end()

}

exports.render = render;
