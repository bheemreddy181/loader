var graphReports = function(){
	var self = this;
	self.createGroupArray = function(){
		var grpList = [];
		$.each(window["groups"], function(grpIndex,group){
			console.log("group", group);
			if(group["timers"]!=null && typeof(group["timers"])!= 'undefined'){
				console.log("group[\"timers\"]", group["timers"]);
				var timers = [];
				$.each(group["timers"], function(timerIndex, timer){
					timers.push({"timerName":timer["name"], "chartName1":"chart-"+grpIndex+"-"+timerIndex + "-1",
						"chartName2":"chart-"+grpIndex+"-"+timerIndex + "-2", "timerDivId":"timer-" + grpIndex + "-" + timerIndex});
				});
				grpList.push({"groupName":group["groupName"], "timers":timers, "groupDivId":"group-" + grpIndex});
			}
		});
		return grpList;
	}
	self.createMonAgentsArray = function(){
		var monList = [];
		$.each(window["monitorResources"], function(monIndex, monResource){
			var monAgent = {};
			monAgent["agent"]=monResource["agent"];
			monAgent["monAgentDivId"] = "agent-" + monIndex;
			monAgent["resources"] = [];
			$.each(monResource["resources"], function(resIndex, resource){
				var type = getResourceType(resource);
				var noOfCharts = window["graphSceme"]["chartResources"][type]["charts"].length;
				noOfCharts = noOfCharts%2==0?noOfCharts:noOfCharts+1;
				var charts = [];
				for(var k=0;k<noOfCharts;){
					var chartName1 = "agent-" + monAgent["agent"] + "-" + resource + "-" + k++;
					var chartName2 = "agent-" + monAgent["agent"] + "-" + resource + "-" + k++;
					chartName1 = chartName1.replace(/\./g,"_");
					chartName2 = chartName2.replace(/\./g,"_");
					charts.push({"chartName1": chartName1,"chartName2": chartName2});
				}
				monAgent["resources"].push({"resourceName":resource, "charts":charts, "resourceDivId":"resource-" + monIndex + "-" + resIndex});
			});
			monList.push(monAgent);
		});
		return monList;
	}
	self.jobGroups = ko.observableArray(self.createGroupArray());
	self.monAgents = ko.observableArray(self.createMonAgentsArray());
}

function getJobStats(){
	var jobId = getQueryParams("jobId");
	$.ajax({
		url: "/loader-server/jobs/" + jobId + "/jobStats",
		type: "GET",
		contentType: "application/json",
		async: false,
		success: function(jobStats){
							console.log("jobStats",jobStats);
			window["groups"] = jobStats;
			window["stats"] = new Array();
			window["groupsURLS"] = [];
			window["graphsState"] = [];
			$.each(jobStats, function(index, group){
							console.log("group",group);
				var groupUrls = {};
				var groupGraphsState = {};
				var timers = group["timers"];
				if( typeof(timers) != 'undefined' && timers != null){
					groupUrls["timerUrls"]=[];
					groupGraphsState["timerGraphsState"]=[];
					groupUrls["counterUrls"]=[];
					$.each(timers, function(timerIndex, timer){
													console.log("timer", timer);
						groupGraphsState["timerGraphsState"].push(false);
						groupUrls["timerUrls"].push("/loader-server/jobs/" + jobId + "/jobStats/groups/" + group["groupName"] + "/timers/" + timer["name"] + "/agents/combined");
						groupUrls["counterUrls"].push({ "count":"/loader-server/jobs/" + jobId + "/jobStats/groups/" + group["groupName"] + "/counters/" + timer["name"] + "_count/agents/combined?last=true",
														"error":"/loader-server/jobs/" + jobId + "/jobStats/groups/" + group["groupName"] + "/counters/" + timer["name"] + "_error/agents/combined?last=true",
														"skip":"/loader-server/jobs/" + jobId + "/jobStats/groups/" + group["groupName"] + "/counters/" + timer["name"] + "_skip/agents/combined?last=true",
														"failure":"/loader-server/jobs/" + jobId + "/jobStats/groups/" + group["groupName"] + "/counters/" + timer["name"] + "_failure/agents/combined?last=true"});
					});
					window["groupsURLS"].push(groupUrls);
					window["graphsState"].push(groupGraphsState);
					window["stats"][index]=new Array();
				}
			});
			console.log("window[\"groupsURLS\"]", window["groupsURLS"]);
		},
		error: function(){

		},
		complete: function(){

		}
	});
}

function getGraphPlotScheme(){
  $.ajax({
    url: "/loader-server/admin/config/report/job",
    type: "GET",
    contentType: "application/json",
    dataType:"json",
    async: false,
    success: function(scheme){
      window["graphSceme"] = scheme;
    },
    error: function(err){

    },
    complete: function(xhr, status){
      console.log("Got the plotting scheme");
    }
  });
}

function getQueryParams(sParam){
	var queryString = window.location.search.substring(2);
	var queryParams = queryString.split('&');
	for (var i = 0; i < queryParams.length; i++){
        var sParameterName = queryParams[i].split('=');
		console.log(sParameterName[0]);
        if (sParameterName[0] == sParam){
				//console.log('matched');
            return sParameterName[1];
        }
    }
    return undefined;
}

function createGroupTree(){
	$("#timerTree").jstree({
		"plugins":["themes", "json_data", "checkbox", "ui"],
		"json_data":{
			"data":[{
				"attr":{"id" : "node_graphs", "rel":"graphs"},
				"data" : "Graphs", 
				"metadata" : { "name" : "Graphs", "nodeType" : "graphs"},    
				"children" : getGraphsChildren()
			}],
		"checkbox":{
			"override_ui":true,
		},
		"progressive_render" : true,
		}
	}).bind("check_node.jstree", function(event, data){
		console.log("You checked ", event, data);
		console.log("metadata", data.rslt.obj.data());
		updateState();
		switch(data.rslt.obj.data("nodeType")){
			case "graphs":
				plotGraphs();
				break;
			case "group":
				plotGroupGraphs(data.rslt.obj.data("groupIndex"));
				break;
			case "timer":
				plotTimerGraph(data.rslt.obj.data("groupIndex"), data.rslt.obj.data("timerIndex"));
				break;
		}
	}).bind("uncheck_node.jstree", function(event, data){
		console.log("You unchecked ", event, data);
		updateState();
		switch(data.rslt.obj.data("nodeType")){
			case "graphs":
				hideGraphs();
				break;
			case "group":
				hideGroupGraphs(data.rslt.obj.data("groupIndex"));
				break;
			case "timer":
				hideTimerGraph(data.rslt.obj.data("groupIndex"), data.rslt.obj.data("timerIndex"));
				break;
		}
	});
	$("#timerTree").bind("loaded.jstree", function (event, data) {
        $("#timerTree").jstree("open_all");
        $.jstree._reference("#timerTree").check_node("#node_"+window["groups"][0]["groupName"]);  
    });
    $("#timerTree").bind("refresh.jstree", function (event, data) {
        $("#timerTree").jstree("open_all");
        $.jstree._reference('#timerTree').check_node("#node_"+window["groups"][0]["groupName"]);  
    });
}

function getGraphsChildren(){
	if(window["groups"]==undefined) return undefined;
	var children = []
	$.each(window["groups"], function(index, group){
		children.push({"attr":{"id":"node_" + group["groupName"],"rel":"group"}, "metadata":{ "nodeType":"group", "groupIndex":index },"data": group["groupName"], "children": getTimersChildren(group["timers"], index)});
	});
	return children;
}

function getTimersChildren(timers, groupIndex){
	if(timers==null || timers.length == 0) return undefined;
	var children = []
	$.each(timers, function(index, timer){
		children.push({"attr":{"id":"node_" + timer["name"], "rel":"timer"},"metadata":{"nodeType":"timer", "groupIndex":groupIndex, "timerIndex": index},"data": timer["name"]});
	})
	return children;
}

function plotTimerGraph(groupIndex, timerIndex){
	$("#timerGraphs").show();
	$("#group-" + groupIndex).show();
	if(!window["graphsState"][groupIndex][timerIndex]){
		returnTimerGraphs(window["groupsURLS"][groupIndex]["timerUrls"][timerIndex], groupIndex, timerIndex, 0, 0);
		window["graphsState"][groupIndex][timerIndex]=true;
	} 
	var divId = "#timer-"+groupIndex + "-" + timerIndex;
	$(divId).show();
}

function plotGroupGraphs(groupIndex){
	$("#timerGraphs").show();
	$("#group-" + groupIndex).show();
	$.each(window["groups"][groupIndex]["timers"], function(timerIndex, timer){
		plotTimerGraph(groupIndex, timerIndex);
	});
}

function plotGraphs() {
	$("#timerGraphs").show();
	$.each(window["groups"], function(groupIndex, group){
		plotGroupGraphs(groupIndex);
	})
}

function hideTimerGraph(groupIndex, timerIndex){
	var divId = "#timer-"+groupIndex + "-" + timerIndex;
	$(divId).hide();
}

function hideGroupGraphs(groupIndex){
	if(window["groups"][groupIndex]["timers"]!=null){
		$.each(window["groups"][groupIndex]["timers"], function(timerIndex, timer){
			hideTimerGraph(groupIndex, timerIndex);
		});
	}
	var divId = "#group-" + groupIndex;
	$(divId).hide();
}

function hideGraphs(){
	$.each(window["groups"], function(groupIndex, group){
		hideGroupGraphs(groupIndex);
	})
	$("#timerGraphs").hide();
}

function createMonitoringTree(){
	$("#monitoringTree").jstree({
		"plugins":["themes", "json_data", "checkbox", "ui"],
		"json_data":{
			"data":[{
				"attr":{"id" : "node_graphs", "rel":"monag"},
				"data" : "MonitoringAgents", 
				"metadata" : { "name" : "MonitoringAgents", "nodeType" : "monag"},    
				"children" : getMonitoringChildren()
			}],
		"checkbox":{
			"override_ui":true,


		},
		"progressive_render" : true,
		}
	}).bind("check_node.jstree", function(event, data){
		console.log("You checked ", event, data);
		switch(data.rslt.obj.data("nodeType")){
			case "agent":
				plotMonAgentGraphs(data.rslt.obj.data("agentIndex"));
				break;
			case "resource":
				plotResourceGraphs(data.rslt.obj.data("agentIndex"), data.rslt.obj.data("resourceIndex"));
				break;
			case "monag":
				plotMonitoringGraphs();

		}
	}).bind("uncheck_node.jstree", function(event, data){
		console.log("You unchecked ", event, data);
		switch(data.rslt.obj.data("nodeType")){
			case "agent":
				hideMonAgentGraphs(data.rslt.obj.data("agentIndex"));
				break;
			case "resource":
				hideResourceGraphs(data.rslt.obj.data("agentIndex"), data.rslt.obj.data("resourceIndex"));
				break;
			case "monag":
				hideMonitoringGraphs();
		}
	});

	$("#monitoringTree").bind("loaded.jstree", function (event, data) {
        $("#monitoringTree").jstree("open_all");
    });
    $("#monitoringTree").bind("refresh.jstree", function (event, data) {
        $("#monitoringTree").jstree("open_all");
    });
}

function getMonitoringChildren(){
	if(window["monitorResources"]==undefined) return undefined;
	var children = [];
	$.each(window["monitorResources"], function(index, monRes){
		children.push({"attr":{"id":"node_"+monRes["agent"], "rel":"agent"}, "metadata":{"nodeType":"agent", "agentIndex":index},"data":monRes["agent"], "children": getResourcesChildren(monRes, index)});
	});
	return children;
}

function getResourcesChildren(monRes, agentIndex){
	if(monRes["resources"]==null) return undefined;
	var children = [];
	$.each(monRes["resources"], function(index, resource){
		children.push({"attr":{"id":"node_"+resource, "rel":"resource"}, "metadata":{"nodeType":"resource", "agentIndex":agentIndex, "resourceIndex":index},"data":resource});
	})
	return children;
}

function getResourceType(resource){
	if(resource.indexOf("jmx") !== -1) return "jmx";
	//if(resource.indexOf("cpu") !== -1) return "cpu.total";
	if(resource.indexOf("memory") !== -1) return "memory";
	if(resource.indexOf("sockets") !== -1) return "sockets";
	if(resource.indexOf("diskspace") !== -1) return "diskspace.root";
	if(resource.indexOf("mysql") !== -1) return "mysql";
	if(resource.indexOf('agentHealth') !== -1) return "agentHealth";
	if(resource.indexOf("redis") !== -1) return "redis";
	return resource;

}

function getMonitoringStats(jobId){
	
	$.ajax({
		url: "/loader-server/jobs/" + jobId + "/monitoringStats",
		type: "GET",
		contentType: "application/json", 
		dataType:"json",
		async: false,
		success: function(monitorResources){
			window["monitorResources"] = monitorResources;
			window["monitoringGraphsState"] = [];
			$.each(monitorResources, function(agentIndex, agent){
				var resPlot = [];
				$.each(agent["resources"], function(resIndex, res){
					resPlot.push(false);
				});
				window["monitoringGraphsState"].push(resPlot);
			});
			//console.log("monitoringResources:",monitorResources);
		},
		error: function(err){

		},
		complete: function(xhr, status){
			console.log("Got all the resources being monitored");
		}
	});
}

function getGraphsData(){
	var jobId = getQueryParams("jobId");
	getMonitoringStats(jobId);
	//getGraphPlotScheme();
	//getMonitoringStats(jobId);
	window["monitoringStats"] = {};
	var metricsToBePlot = window["monitorResources"];
	//console.log("metricsToBePlot:", metricsToBePlot);
	$.each(metricsToBePlot, function(index, metric){
		var agentName = metric["agent"];
		var resources = metric["resources"];
		window["monitoringStats"][agentName]={};
		//console.log("agentName:", agentName);
		//console.log("resources", resources);
		$.each(resources, function(index, resource){
			window["monitoringStats"][agentName][resource] = {};
			$.ajax({
				url: "/loader-server/jobs/" + jobId + "/monitoringStats/agents/" + agentName + "/resources/" + resource,
				type: "GET",
				contentType: "text/plain",
				async: false,
				success: function(resourceData){
					//console.log("resourceData: ", resourceData);
					var type = getResourceType(resource);
					var attributesToPlot = new Array();
					$.each(window["graphSceme"]["chartResources"][type]["charts"], function(index, chart){
						//console.log("chart:", chart["keysToPlot"]);
						attributesToPlot=attributesToPlot.concat(chart["keysToPlot"]);
						//console.log("attributesToPlot :", attributesToPlot);
					});
					//console.log("type :", type);
					//console.log("attributesToPlot :", attributesToPlot);
					var resourceDataLines = resourceData.split('\n');
					//console.log("resourceDataLines:", resourceDataLines);
					$.each(resourceDataLines, function(lineIndex, resourceDataLine){
						//console.log("resourceDataLine:", resourceDataLine);
						if (resourceDataLine!==""){ 
							$.each(attributesToPlot, function(metricIndex, attr){
								if(!window["monitoringStats"][agentName][resource][attr]) window["monitoringStats"][agentName][resource][attr]=new Array();
								try {
									var resourceDataJson = $.parseJSON(resourceDataLine);
									window["monitoringStats"][agentName][resource][attr].push({x: new Date(resourceDataJson[0]["time"]), y: resourceDataJson[0]["metrics"][attr]});
								} catch (err){
									console.log("Err in parsing", resourceDataLine);
								} 
							});
						}
					});
				},
				error: function(err){
					console.log(err);
				},
				complete: function(xhr, status){
					console.log("Done fetching data");
				}
			});
		});
	});
	//console.log("monitoringStats:", window["monitoringStats"]);
}

function getResourceType(resource){
	if(resource.indexOf("jmx") !== -1) return "jmx";
	//if(resource.indexOf("cpu") !== -1) return "cpu.total";
	if(resource.indexOf("memory") !== -1) return "memory";
	if(resource.indexOf("sockets") !== -1) return "sockets";
	if(resource.indexOf("diskspace") !== -1) return "diskspace.root";
	if(resource.indexOf("mysql") !== -1) return "mysql";
	if(resource.indexOf('agentHealth') !== -1) return "agentHealth";
	if(resource.indexOf("redis") !== -1) return "redis";
	return resource;

}

function plotResourceGraphs(agentIndex, resourceIndex){
	$("#monGraphs").show();
	$("#agent-" + agentIndex).show();
	$("#resource-" + agentIndex + "-" + resourceIndex).show();
	if (!window["monitoringGraphsState"][agentIndex][resourceIndex]){
		var resource = window["monitorResources"][agentIndex]["resources"][resourceIndex];
		var type = getResourceType(resource);
		var charts = window["graphSceme"]["chartResources"][type]["charts"];
		var agentName = window["monitorResources"][agentIndex]["agent"];
		$.each(charts, function(chartIndex, chart){
			formatTime = d3.time.format("%H:%M"),
			formatMinutes = function(d) { return formatTime(new Date(d)); };
			var chart1;
			nv.addGraph(function() {
	  			chart1 = nv.models.lineChart();
	  					//chart1.x(function(d,i) {  return i });
	  					//chart1.y(function(d,i){ return i/1000});
				chart1.xAxis
	  						//.ticks(d3.time.seconds, 60)
	    			.tickFormat(function(d) { return d3.time.format('%H:%M')(new Date(d)); });

	  			chart1.yAxis
	      			.axisLabel('Time (ms)')
	      			.tickFormat(d3.format('.1s'));
	      		var chart1PlaceHolder = "#agent-" + agentName + "-" + resource + "-" + chartIndex;
	      		chart1PlaceHolder = chart1PlaceHolder.replace(/\./g,"_");
	      				//console.log("chart1PlaceHolder", chart1PlaceHolder);
	      		d3.select(chart1PlaceHolder + " svg")
	      			.datum(getChartData(agentName, resource, chart))
	    			.transition().duration(500)
	      			.call(chart1);
	      		nv.utils.windowResize(chart1.update);
	  			chart1.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });
	  			return chart1;
	  		});
	  	});
	  	window["monitoringGraphsState"][agentIndex][resourceIndex]=true;	
	}
}

function plotMonAgentGraphs(agentIndex){
	$("#monGraphs").show();
	$("#agent-" + agentIndex).show();
	var agent = window["monitorResources"][agentIndex];
	$.each(agent["resources"], function(resIndex, resource){
		plotResourceGraphs(agentIndex, resIndex);
	});
}

function plotMonitoringGraphs(){
	$.each(window["monitorResources"], function(index, res){
		plotMonAgentGraphs(index);
	})
}

function hideResourceGraphs(agentIndex, resIndex){
	$("#resource-" + agentIndex + "-" + resIndex).hide();
}

function hideMonAgentGraphs(agentIndex){
	$.each(window["monitorResources"][agentIndex]["resources"], function(resIndex, res){
		hideResourceGraphs(agentIndex, resIndex);
	})
	$("#agent-" + agentIndex).hide();
}

function hideMonitoringGraphs(){
	$.each(window["monitorResources"], function(agentIndex, res){
		hideMonAgentGraphs(agentIndex);
	})
	$("#monGraphs").hide();
}


function getChartData(agentName, resource, chart){
	var returnData = new Array();
	$.each(chart["keysToPlot"], function(attrIndex, attr){
		returnData.push({values: window["monitoringStats"][agentName][resource][attr], key: attr, color: pickColor(attrIndex)});
	});
	//console.log("returnData", returnData);
	return returnData;
}

function pickColor(index){
	var colors = ["#ff7f0e","#a02c2c","#B40404","#0B610B", "#0B0B61", "#FE9A2E", "#0E0D0D", "#2ca02c", "#DF01D7"];
	return colors[index%9];
}

function updateState(){
	var selectedTimerNodes = $.jstree._reference('#timerTree').get_checked(null, 'get_all');
	var selectedMonNodes = $.jstree._reference('#monitoringTree').get_checked(null, 'get_all');
	console.log(selectedTimerNodes, selectedMonNodes);
	//history.replaceState(null, null, )
}
