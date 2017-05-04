var canvas;
var stage;

function init() {
    var canvasID = "c";
    
    canvas = document.getElementById(canvasID);
    window.context = canvas.getContext("2d");
    
    stage = new createjs.Stage(canvasID);
    createjs.Ticker.on("tick", function() {
        stage.update();
    });
    
    handleResizing();
    testComponents();
}

/**
 * 
 * 
 */
function handleResizing() {
    window.addEventListener("resize", resizeCanvas, false);
    resizeCanvas();
     
    function resizeCanvas(e) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

/**
 * 
 * 
 */
function testComponents() {
    stage.addChild(createChartA0());
    stage.addChild(createChartB0());
    stage.addChild(createChartC0());
}

/**
 * 
 * 
 */
function createChartA0() {
    var size = {width: window.innerWidth - 50, height: 250};
    var point = {width: size.width / 70, height: 0.20};
    var axis = {offset: 50, isDynamic: true, dynamicSpace: {top: 50, bottom: 50}};
    var style = {
        background: {color: "#00AAFF", alpha: 0.1},
        grid: {thickness: 0.5, color: "#00FFFF", alpha: 0.5, width: 5, height: 300, dash: [1, 0]},
        zero:  {thickness: 1, color: "#00FFFF", alpha: 0.75},
        chart: {
            lines: {thickness: 1, color: "#003333", alpha: 0.75, bounds: true},
            points:  {thickness: 0, radius: 0, lineColor: "#000000", fillColor: "#FF0000", alpha: 0, bounds: true}
        }
    };
    
    var chart = new charts.StreamingChart(size, point, axis, style);
    chart.y = 25;
    chart.x = 25;
    
    var t = 0;
    setInterval(function() {
        var data = [];
        data.push(Math.sin(t) * Math.abs(Math.sin(t)) * 2500);
        chart.append(data);
        t += 0.050;
    }, 50);
    
    return chart;
}

/**
 * 
 * 
 */
function createChartB0() {
    var size = {width: window.innerWidth - 50, height: 100};
    var point = {width: size.width / 50, height: 0.1};
    var axis = {offset: 0, isDynamic: false, dynamicSpace: {top: 0, bottom: 0}};
    var style = {
        background: {color: "#FF0000", alpha: 0.1},
        grid: {thickness: 10, color: "#FFFFFF", alpha: 1, width: 0, height: 200, dash: [1, 0]},
        zero:  {thickness: 1, color: "#000000", alpha: 0},
        chart: {
            lines: {thickness: 2, color: "#000000", alpha: 0.8, bounds: false},
            points:  {thickness: 2, radius: 2, lineColor: "#000000", fillColor: "#FFFFFF", alpha: 1, bounds: false}
        }
    };
    
    var chart = new charts.StreamingChart(size, point, axis, style);
    chart.y = 300;
    chart.x = 25;
    
    var t = 0;
    var shift = size.height / point.height / 2;
    setInterval(function() {
        chart.append([Math.cos(t) * 600 + shift]);
        t += 0.50;
    }, 200);
    
    return chart;
}

/**
 * 
 * 
 */
function createChartC0() {
    var size = {width: window.innerWidth - 50, height: 200};
    var point = {width: size.width / 200, height: 2};
    var axis = {offset: 0, isDynamic: true, dynamicSpace: {top: 10, bottom: 20}};
    var style = {
        background: {color: "#00BB00", alpha: 0.1},
        grid: {thickness: 0.5, color: "#00CC00", alpha: 0.25, width: 10, height: 10, dash: [1, 0]},
        zero:  {thickness: 1, color: "#00FF00", alpha: 0.75},
        chart: {
            lines: {thickness: 1, color: "rgba(0, 0, 0, 255)", alpha: 0.75, bounds: true},
            points:  {thickness: 0, radius: 0, lineColor: "rgba(0, 0, 0, 255)", fillColor: "#5AFF27", alpha: 1, bounds: true}
        }
    };
    
    var chart = new charts.StreamingChart(size, point, axis, style);
    chart.y = 425;
    chart.x = 25;
    
    var data;
    var req = new XMLHttpRequest();
    requestData();
    
    function requestData() {
        req.open("GET", "test.json", true);
        
        req.addEventListener("load", reqCompleteHandler, false);
        req.addEventListener("error", reqErrorHandler, false);
        
        req.send();
    }
    
    function reqCompleteHandler(e) {
        data = JSON.parse(req.responseText);
        
        var randLength = Math.floor(Math.random() * data.length / 5) + 10;
        chart.append(data.splice(0, randLength));
        var t = 0;
        
        setInterval(function() {
            chart.append(data[t]);
            t ++;
        }, 50);
    }
    
    function reqErrorHandler(e) {
        alert(req.status + ": " + req.statusText);
    }
    
    return chart;
}