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
        agregateStats(taskList, dateObject, today, thirtyDaysAgo);
        renderHtml(response,  dateObject);
     });
  });
}

function populateDates(start, end, dateObject) {
    var current = new Date(start);

    while (current >= end) {
        dateObject[current.valueOf()] =
          {"completedTasks": 0,
           "completedSubtasks": 0,
           "remainingTasks": 0,
           "followers": 0};
        current.setDate(current.getDate() - 1);
    }

}

function agregateStats(taskList, dateObject, today, thirtyDaysAgo) {

  console.log("Agregating task statistics.")

  // tasks that are still open, or have been completed in the last 30 days
  taskList = __.filter(taskList, function(task) {
    if (task.data.completed) {
      taskDate = new Date(task.data.completed_at);
      taskDay = roundToDay(taskDate);
      return taskDay <= today.valueOf() && taskDay >= thirtyDaysAgo.valueOf();
    }
    return true;
  });

  // calculate statistics and store into dateObject
  calculateData(taskList, dateObject);

}

function calculateData(taskList, dateObject){

  /* TODO
   * - Subtasks completed doesn't work yet
   *    - Need to pull subtasks seperately for each task
   * - Average time to complete tasks;
   * - Average time to complete subtasks;
   * - Percentage of completed tasks vs open tasks;
   * - Distinct followers;
   * - Number of projects I belong to
   * - Numer of days early / late user completed from due date
   */

  __.each(taskList, function(task) {

    // put completed task in appropiate array slot
    if (task.data.completed) {

      dateCompleted = roundToDay(new Date(task.data.completed_at));
      // check if task or subtask
      console.log(task.data.parent);
      if (!task.data.parent) {
        dateObject[dateCompleted.valueOf()].completedTasks++;
      } else {
        dateObject[dateCompleted.valueOf()].completedSubtasks++;
      }
    } else {
        dateCreated = roundToDay(new Date(task.data.created_at));
        numFollowers = task.data.followers.length;

        // TODO: modify to traverse dict backwards
        for (var d in dateObject) {
          if (dateCreated.valueOf() <= d) {
            dateObject[d].remainingTasks++;
            dateObject[d].followers += numFollowers;
            // TODO: num distinct followers
          }
        }
    }
  });

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

function renderHtml(response, dateObject) {
  formattedData = formatData(dateObject);

  fs.readFile("graphs.html",function(err,template) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        template = template.toString();
        response.write(mustache.to_html(template, formattedData));
        response.end()
   })
}

function formatData(dateObject) {
  formattedData = {};
  formattedStringData = {};

  for (var key in dateObject) {
    for (var stat in dateObject[key]) {
      formattedData[stat] = [];
    }
    break;
  };

  for (var key in dateObject) {
    for (var stat in dateObject[key]) {
      formattedData[stat].push(["new Date(" + key + ")",dateObject[key][stat]]);
    }
  }

  for (var key in dateObject) {
    for (var stat in dateObject[key]) {
      formattedStringData[stat] = JSON.stringify(formattedData[stat]).replace(/\"/g, '');
    }
  }

  return formattedStringData;
}

function roundToDay(date) {
    return (new Date(date.getFullYear(), date.getMonth(), date.getDate())).valueOf();
}

exports.render = render;
