var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");
var renderCharts = require("./renderCharts");

var handle = {}
handle["/"] = requestHandlers.start
handle["/start"] = requestHandlers.start;
handle["/getWorkspaces"] = requestHandlers.getWorkspaces;
handle["/render"] = renderCharts.render;

server.start(router.route, handle);
