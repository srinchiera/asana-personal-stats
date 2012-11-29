var url = require('url');
var http = require('http');
var https = require('https');
var async = require('async');
var mustache = require('mustache');
var fs = require('fs');
var __ = require('underscore');

function render(response, request) {

  console.log("Got to the render function!");
  queryData = url.parse(request.url, true).query;

  apiKey = queryData.apiKey;
  workspaceId = queryData.workspaceId;

  taskList = [];

  dateObject = {};
  now = new Date();
  today = new Date (now.getFullYear(), now.getMonth(), now.getDate());
  thirtyDaysAgo =  (new Date(today)).setDate(-30);
  dateList = populateDates(today, thirtyDaysAgo, dateObject);
  console.log(dateObject);

  /*
  TODO, add story statistics
  storyList = []
  */

  getTasks(apiKey, workspaceId, response, function(tasks)
    {
      async.forEach(JSON.parse(tasks).data, function(item, callback) {
        getTaskDetails(item, taskList, callback);
      }, function(err){
        console.log("Successfully fetched all tasks.")
        console.log("Agregating task statistics.")
        agregateStats(taskList, dateObject, today, thirtyDaysAgo);
        renderHtml(response);
     });
  });
}

function populateDates(start, end, dateObject) {
    var current = new Date(start);

    while (current >= end) {
        dateObject[current.valueOf()] = {"completedTasks": 0};
        current.setDate(current.getDate() - 1);
    }

}

function agregateStats(taskList, dateObject, today, thirtyDaysAgo) {

  // tasks that are still open, or have been completed in the last 30 days
  taskList = __.filter(taskList, function(task) {
    if (task.data.completed) {
      taskDate = new Date(task.data.completed_at);
      taskDay = roundToDay(taskDate);
      return taskDay <= today.valueOf() && taskDay >= thirtyDaysAgo.valueOf();
    }
    return true;
  });

  // get all tasks completed on some date
  getCompletedTasks(taskList, dateObject);
}

function getCompletedTasks(taskList, dateObject){

  __.each(taskList, function(task) {
    if (task.data.completed) {
      console.log("completed task");
      date = roundToDay(new Date(task.data.completed_at));
      console.log("completed task on: " + new Date(date).toString());
      dateObject[date.valueOf()].completedTasks++;
    }
  });

  console.log(dateObject);
}

// This code is very repetetive, refactor!
function getTaskDetails(task, storyList, callback) {
  taskId = task.id;

  var options = {
    host: 'app.asana.com',
    path: '/api/1.0/tasks/'+taskId,
    auth: apiKey + ':',
    method: 'GET'
  };

  reqCallback = function(serverResponse) {
    var str = ''
    serverResponse.on('data', function (chunk) {
      str += chunk;
    });

    serverResponse.on('end', function () {
      storyList.push(JSON.parse(str));
      callback();
    });
  }

  console.log("Sending API request for task: " + taskId);
  var req = https.request(options, reqCallback);
  req.end();

}

function getTaskDetails(task, taskList, callback) {
  taskId = task.id;

  var options = {
    host: 'app.asana.com',
    path: '/api/1.0/tasks/'+taskId,
    auth: apiKey + ':',
    method: 'GET'
  };

  reqCallback = function(serverResponse) {
    var str = ''
    serverResponse.on('data', function (chunk) {
      str += chunk;
    });

    serverResponse.on('end', function () {
      taskList.push(JSON.parse(str));
      callback();
    });
  }

  console.log("Sending API request for task: " + taskId);
  var req = https.request(options, reqCallback);
  req.end();

}

function getTasks(apiKey, workspaceId, response, callback) {

  var options = {
    host: 'app.asana.com',
    path: '/api/1.0/tasks?workspace='+workspaceId+'&assignee=me',
    auth: apiKey + ':',
    method: 'GET'
  };

  reqCallback = function(serverResponse) {
    var str = ''
    serverResponse.on('data', function (chunk) {
      str += chunk;
    });

    serverResponse.on('end', function () {
      callback(str);
    });
  }

  console.log("Sending API request for tasks in Workspace: " + workspaceId);
  var req = https.request(options, reqCallback);
  req.end();

}

function renderHtml(response) {
  list = [['Year', 'Sales'],['2004',  1000],['2005',  1170],['2006',  660],['2007',  1030]];
  data = {"tasksCompleted": JSON.stringify(list)};

  fs.readFile("graphs.html",function(err,template) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        template = template.toString();
        response.write(mustache.to_html(template, data));
        response.end()
   })
}

function roundToDay(date) {
    return (new Date(date.getFullYear(), date.getMonth(), date.getDate())).valueOf();
}

exports.render = render;
