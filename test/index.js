(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * @author R.Akhtyamov
 * https://github.com/Heterotroph/StreamingChart
 */
console.log("test C");
(function() {
    console.log("test D");
    /**
     *  Streaming chart.
     *  @constructor
     *  @param {object} size - Chart size as an object in pixels. Example: {width: 1000, height: 400}
     *  @param {object} point - Point size as an object in pixels. Example: {width: 50, height: 1}
     *  @param {object} axis - Axis parameters. Example: {offset: 0, dynamicSpace: {top: 10, bottom: 0}, isDynamic: false}
     *  @param {object} style - Visual parameters. Example:
     *    {
     *        background: {color: "#000000"},
     *        grid: {thickness: 1, color: "#00FFFF", width: 1, height: 20, dash: [1, 0], offset: 0},
     *        axisX:  {thickness: 1, color: "rgba(0,0,0,.9)"},
     *        chart: {
     *            lines: {thickness: 3, color: "#000000", dash: [1, 0], bounds: true},
     *            points:  {thickness: 3, radius: 2, lineColor: "#0000FF", fillColor: "#FF0000", bounds: true},
     *            fill: {
     *                type: "linear",
     *                isSymmetric: true,
     *                colors: ["rgba(0,255,255,0.9)", "rgba(0,255,255,0.1)", "rgba(0,255,255,0.9)"],
     *                ratios: [0, 0.5, 1],
     *                coords: [0, 0, 0, 1]
     *            }
     *        }
     *    }
     */ 
    function StreamingChart(size, point, axis, style) {
        this.Container_constructor();
        
        //chart points data
        this._data = [];
        
        //configuration
        this._size = size;
        this._point = point;
        this._axis = axis;
        this._style = style;
        
        //dynamic values
        this._widthCapacity = 0;
        this._heightCapacity = 0;
        this._dynamicOffset = axis.offset;
        this._dynamicPoint = {width: point.width, height: point.height};
        this._extremeMax = {value: -Number.MAX_VALUE, age: Number.MAX_VALUE};
        this._extremeMin = {value: Number.MAX_VALUE, age: Number.MAX_VALUE};
        
        //views
        this._backgroundShape = this.addChild(new createjs.Shape());
        this._gridShape = this.addChild(new createjs.Shape());
        this._fillShape = this.addChild(new createjs.Shape());
        this._axisXShape = this.addChild(new createjs.Shape());
        this._chartShape = this.addChild(new createjs.Shape());
        this._pointShape = this.addChild(new createjs.Shape());
        
        //apply style configuration
        this._calculateCapacity();
        this.redraw();
    }
    
    var LIMIT = 1000;
    var p = createjs.extend(StreamingChart, createjs.Container);
    
    //
    //
    //
    //  PUBLIC METHODS
    //
    //
    //
    
    /**
     * Adds points without deleting existing ones if their number is less than or equal to the calculated capacity by width
     * @param {Array.<number>} data - Array of points of type Number
     */
    p.append = function(data) {
        if (data.length === 0) return;
        var totalData = this._data.concat(data);
        this._data = totalData.splice(-this._widthCapacity);
        
        this._searchExtreme(data);
        this._processExtreme();
        
        this._clearChartAndPoints();
        this._drawChart(0, this._dynamicPoint.width, this._data, this._style.chart);
    };
    
    /**
     * Replaces the last n points
     * @param {Array.<number>} data - Array of points of type Number
     */
    p.replace = function(data) {
        if (data.length === 0) return;
        this._data.length -= Math.min(data.length, this._data.length);
        this.set(this._data.concat(data));
    };
    
    /**
     * Specifies the points
     * @param {Array.<number>} data - Array of points of type Number
     */
    p.set = function(data) {
        this.clear();
        if (data.length) {
            this._data = [];
            this.append(data);
        }
    };
    
    /**
     * Remove points from chart
     * @param {number} count - Number of points to remove. A negative count indicated last elements in the sequence.
     */
    p.remove = function(count) {
        if (count === 0) return;
        if (count < 0) {
            this._data.length = Math.max(0, this._data.length + count);
        } else {
            this._data.splice(0, count);
        }
        this.set(this._data);
    };
    
    /**
     * Remove all point and clear chart
     */
    p.clear = function() {
        this._data = [];
        this._clearChartAndPoints();
        this._extremeMax = {value: -Number.MAX_VALUE, age: this._widthCapacity};
        this._extremeMin = {value: Number.MAX_VALUE, age: this._widthCapacity};
        this._moveAxisX(0);
    };
    
    /**
     * Redraw all
     */
    p.redraw = function() {
        if (this._data.length > 0) this.set(this._data);
        this._drawBackgroundShape(this._size, this._style.background);
        this._updateGrid(this._style.grid);
        this._drawAxisX(this._style.axisX);
        var lines = this._style.chart.lines;
        this._updateMask(this._chartShape, lines ? lines.bounds : false);
        var fill = this._style.chart.fill;
        this._updateMask(this._fillShape, fill ? fill.bounds : false);
    };
    
    /**
     * Replace style object and redraw
     */ 
    p.setStyle = function(style) {
        this._style = style;
        this.redraw();
    };
    
    /**
     * Replace grid width and redraw
     */
    p.setGrid = function(width, height) {
        this._style.grid.width = width;
        this._style.grid.height = height;
        this._updateGrid(this._style.grid);
    };
    
    /**
     * Returns current grid size
     */
    p.getGrid = function() {
        return {width: this._style.grid.width, height: this._style.grid.height};
    };

    /**
     * Specifies start position of vertical grid lines
     */
    p.setGridOffset = function(value) {
        this._style.grid.offset = value;
        this._updateGrid(this._style.grid);
    };

    /**
     * Returns start position of vertical grid lines
     */
    p.getGridOffset = function() {
        return this._style.grid.offset;
    };
    
    /**
     * Specifies chart size and the relative change size of the point
     */
    p.setComplexSize = function(width, height) {
        this._point.width *= width / this._size.width;
        this._point.width = Math.floor(this._point.width * LIMIT) / LIMIT;
        this._point.height *= height / this._size.height;
        this._point.height = Math.floor(this._point.height * LIMIT) / LIMIT;
        this._dynamicPoint = {width: this._point.width, height: this._point.height};
        this._size.width = width;
        this._size.height = height;
        this.redraw();
    };
    
    /**
     * Specifies chart size
     */
    p.setSize = function(width, height) {
        this._size.width = width;
        this._size.height = height;
        this._calculateCapacity();
        this.redraw();
    };
    
    /**
     * Returns chart size
     */
    p.getSize = function() {
        return {width: this._size.width, height: this._size.height};
    };
    
    /**
     * Specifies point size
     */
    p.setPoint = function(width, height) {
        this._point.width = Math.max(width, 1 / LIMIT);
        this._point.height = Math.max(height, 1 / LIMIT);
        this._dynamicPoint = {width: this._point.width, height: this._point.height};
        this._calculateCapacity();
        this.redraw();
    };
    
    /**
     * Returns current point size
     */
    p.getPoint = function() {
        return {width: this._dynamicPoint.width, height: this._dynamicPoint.height};
    };
    
    /**
     * Set dynamic Y offset
     */
    p.setOffset = function(value) {
        this._axis.offset = value;
        this._dynamicOffset = value;
        this._calculateCapacity();
        this.redraw();
    };
    
    /**
     * Returns dunamic Y offset
     */
    p.getOffset = function() {
        return this._dynamicOffset;
    };
    
    /**
     * Returns data
     */
    p.getData = function() {
        return this._data.slice();
    };
    
    /**
     * Returns data length
     */
    p.getDataLength = function() {
        return this._data.length;
    };
        
    /**
     * Returns width capacity of the points
     */
    p.getCapacity = function() {
        return this._widthCapacity;
    };
    
    /**
     * Returns currently displayed extreme values of the data
     */
    p.getExtreme = function() {
        var indexCapacity = Math.min(this._data.length, this._widthCapacity) - 1;
        var min = {
            value: this._extremeMin.value,
            index: indexCapacity - this._extremeMin.age
        };
        var max = {
            value: this._extremeMax.value,
            index: indexCapacity - this._extremeMax.age
        };
        return {min: min, max: max};
    };
    
    /**
     * Returns value of data by floating index with interpolation of two points
     */
    p.getInterpolatedValue = function(index) {
        if (this._data.length === 0) return 0;
        index = Math.round(index * LIMIT) / LIMIT;
        index = Math.min(index, this._data.length - 1);
        index = Math.max(index, 0);
        var intIndex = Math.floor(index);
        if (intIndex === index) return this._data[index];
        var delta = this._data[intIndex + 1] - this._data[intIndex];
        return this._data[intIndex] + delta * (index - intIndex);
    };
    
    /**
     * Returns value of data by x (pixels) coordinate with interpolation of two points
     */
    p.getInterpolatedValueByLocalX = function(localX) {
        var index = localX / this._dynamicPoint.width;
        return this.getInterpolatedValue(index);
    };
    
    /**
     * Returns data index by x coordinate
     */
    p.getIndexByLocalX = function(localX) {
        var index = Math.round(localX / this._dynamicPoint.width);
        return Math.min(index, this._data.length - 1);
    };
    
    /**
     * Returns data x coordinate by index
     */
    p.getLocalXByIndex = function(index) {
        var localX = index * this._dynamicPoint.width;
        return Math.round(localX);
    };
    
    /**
     * Returns value in displayed range by y coordinate
     */
    p.getValueByLocalY = function(localY) {
        return (this._size.height - localY) / this._dynamicPoint.height + this._dynamicOffset;
    };
    
    /**
     * Returns y coordinate in displayed range by value
     */
    p.getLocalYByValue = function(value) {
        var localY = this._size.height - (this._applyOffset(value) * this._dynamicPoint.height);
        return Math.round(localY);
    };
    
    //
    //
    //
    //  PRIVATE METHODS (VIEW)
    //
    //
    //
    
    p._drawChart = function(offsetX, stepX, data, style) {
        var coords = [];
        for (var i = 0; i < data.length; i++) {
            var currentX = Math.round(offsetX + stepX * i);
            var currentY = this.getLocalYByValue(data[i]);
            coords.push({x: currentX, y: currentY});
        }
        if (!style) return;
        this._drawLines(offsetX, coords, style.lines);
        this._drawPoints(offsetX, coords, style.points);
        this._drawFill(offsetX, coords, style.fill);
    };
    
    p._drawLines = function(offsetX, coords, style) {
        if (!style) return;
        if (Object.keys(style).length < 0) return;
        var dash = style.dash || [1, 0];
        var thickness = style.thickness || 0;
        var color = style.color || "#000000";
        var graphics = this._chartShape.graphics;
        graphics.setStrokeDash(dash)
                .setStrokeStyle(thickness, 1, 0, 0, true)
                .beginStroke(color);
        if (offsetX === 0) graphics.moveTo(coords[0].x, coords[0].y);
        for (var i = 0; i < coords.length; i++) {
            graphics.lineTo(coords[i].x, coords[i].y);
        }
        graphics.endStroke();
    };
    
    p._drawPoints = function(offsetX, coords, style) {
        if (!style) return;
        if (Object.keys(style).length < 0) return;
        if (style.radius === 0) return;
        var thickness = style.thickness || 0;
        var color = style.lineColor || "#000000";
        var graphics = this._pointShape.graphics;
        graphics.setStrokeStyle(thickness)
                .beginStroke(color);
        var startIndex = offsetX === 0 ? 0 : 1;
        for (var i = startIndex; i < coords.length; i++) {
            this._drawPoint(coords[i].x, coords[i].y, style);
        }
        graphics.endStroke();
    };
    
    p._drawPoint = function(x, y, style) {
        var graphics = this._pointShape.graphics;
        if (style.bounds && !this._isInsideBounds(x, y)) return;
        var color = style.fillColor || "#000000";
        graphics.beginFill(color)
                .drawCircle(x, y, style.radius)
                .endFill();
    };
    
    p._drawFill = function(offsetX, coords, style) {
        if (!style) return;
        if (coords.length < 2) return;
        var hasFill = this._beginFillShape(coords, style);
        if (!hasFill) return;
        var graphics = this._fillShape.graphics;
        var isFirst = offsetX === 0;
        if (isFirst) graphics.moveTo(coords[0].x, coords[0].y);
        for (var i = Number(isFirst); i < coords.length; i++) {
            graphics.lineTo(coords[i].x, coords[i].y);
        }
        var axisY = this.getLocalYByValue(0);
        var tY = this._extremeMin.value < 0 ? axisY : Math.min(this._size.height, axisY);
        graphics.lineTo(coords[coords.length - 1].x, tY)
                .lineTo(offsetX, tY)
                .closePath()
                .endStroke()
                .endFill();
    };
    
    p._beginFillShape = function(coords, style) {
        var graphics = this._fillShape.graphics.clear();
        switch (style.type) {
            case "solid":
                graphics.beginFill(style.color);
                break;
            case "linear":
                var top = Math.abs(this._extremeMax.value);
                var offset = this.getLocalYByValue(top);
                var width = coords[coords.length - 1].x - coords[0].x;
                var height = 0;
                if (style.isSymmetric) {
                    var bottom = Math.abs(this._extremeMin.value);
                    var absoluteMax = Math.max(top, bottom);
                    height = absoluteMax * this._dynamicPoint.height * 2;
                    if (bottom === absoluteMax) {
                        offset += -Math.abs(top - bottom) * this._dynamicPoint.height;
                    }
                } else {
                    var delta = Math.abs(this._extremeMax.value - this._extremeMin.value);
                    height = delta * this._dynamicPoint.height;
                }
                graphics.beginLinearGradientFill(
                    style.colors,
                    style.ratios,
                    style.coords[0] * width,
                    style.coords[1] * height + offset,
                    style.coords[2] * width,
                    style.coords[3] * height + offset
                );
                break;
            default:
                return false;
        }
        return true;
    };
    
    p._drawBackgroundShape = function(size, style) {
        var graphics = this._backgroundShape.graphics.clear();
        if (!style) return;
        if (Object.keys(style).length < 0) return;
        var color = style.color || "rgba(255,255,255,0)";
        graphics.beginFill(color)
                .rect(0, 0, size.width, size.height)
                .endFill();
    };
    
    p._updateGrid = function(style) {
        if (style) {
            var width = style.width || 0;
            var height = style.height || 0;
            var offset = style.offset || 0;
            var stepX = this._dynamicPoint.width * width;
            var startX = offset * this._dynamicPoint.width % stepX;
            startX = startX <= 0 ? startX + stepX : startX;
            var stepY = this._dynamicPoint.height * height;
            this._drawGridShape(stepX, startX, stepY, style);
        } else {
            this._gridShape.graphics.clear();
        }
    };
    
    p._drawGridShape = function(stepX, startX, stepY, style) {
        var graphics = this._gridShape.graphics.clear();
        if (!style) return;
        if (Object.keys(style).length < 0) return;
        var dash = style.dash || [1, 0];
        var thickness = style.thickness || 0;
        var color = style.color || "rgba(255,255,255,0)";
        graphics.setStrokeDash(dash)
                .setStrokeStyle(thickness)
                .beginStroke(color);
        if (stepX > 0) {
            for (var x = startX; x < this._size.width; x += stepX) {
                graphics.moveTo(x, 0).lineTo(x, this._size.height);
            }
        }
        var gridOffset = (-this._dynamicOffset * this._dynamicPoint.height) % stepY;
        gridOffset = gridOffset < 0 ? gridOffset + stepY : gridOffset;
        if (stepY > 0) {
            for (var y = this._size.height - gridOffset; y >= 0; y -= stepY) {
                graphics.moveTo(0, y).lineTo(this._size.width, y);
            }
        }
        graphics.endStroke();
    };
    
    p._updateMask = function(shape, bounds) {
        shape.mask = null;
        if (!bounds) return;
        this._drawMaskShape(shape, 0, 0, this._size.width, this._size.height);
    };
    
    p._drawMaskShape = function(shape, x, y, width, height) {
        shape.mask = new createjs.Shape();
        var graphics = shape.mask.graphics;
        graphics.beginFill("#000000")
                .rect(x, y, width, height)
                .endFill();
    };
    
    p._drawAxisX = function(style) {
        var graphics = this._axisXShape.graphics.clear();
        if (!style) return;
        if (Object.keys(style).length < 0) return;
        var thickness = style.thickness || 0;
        var color = style.color || "#000000";
        graphics.setStrokeStyle(thickness)
                .beginStroke(color)
                .moveTo(0, 0)
                .lineTo(this._size.width, 0)
                .endStroke();
        this._moveAxisX(0);
    };
    
    p._moveAxisX = function(offset) {
        this._axisXShape.y = this._size.height - this._applyOffset(offset) * this._dynamicPoint.height;
        this._axisXShape.visible = this._isInsideBounds(0, this._axisXShape.y);
    };
    
    p._processExtreme = function() {
        if (!this._axis.isDynamic) return;
        var isDynamicChanged = this._calculateDynamic();
        if (!isDynamicChanged) return;
        this._updateGrid(this._style.grid);
        this._moveAxisX(0);
    };
    
    p._clearChartAndPoints = function() {
        this._chartShape.graphics.clear();
        this._pointShape.graphics.clear();
        this._fillShape.graphics.clear();
    };
    
    //
    //
    //
    //  PRIVATE METHODS (UTILS)
    //
    //
    //
    
    p._calculateDynamic = function() {
        var workHeight = this._size.height - this._axis.dynamicSpace.top - this._axis.dynamicSpace.bottom;
        var workDelta = this._extremeMax.value - this._extremeMin.value  - this._axis.offset;
        var tempPointHeight = workHeight / Math.max(workDelta, 1 / LIMIT);
        
        var tempAxisOffset = this._extremeMin.value - this._axis.dynamicSpace.bottom / tempPointHeight;
        
        var result = this._dynamicPoint.height != tempPointHeight || this._dynamicOffset != tempAxisOffset;
        this._dynamicOffset = tempAxisOffset;
        this._dynamicPoint.height = tempPointHeight;
        if (result) this._calculateCapacity();
        
        return result;
    };
    
    p._calculateCapacity = function() {
        this._widthCapacity = Math.round(this._size.width /  this._dynamicPoint.width) + 1;
        this._heightCapacity = Math.round(this._size.height / this._dynamicPoint.height) + 1;
    };
    
    p._applyOffset = function(y) {
        return y - this._dynamicOffset;
    };
    
    p._isInsideBounds = function(x, y) {
        return x >= 0 && x <= this._size.width
            && y >= 0 && y <= this._size.height;
    };
    
    p._searchExtreme = function(data) {
        var newExtreme;
        this._extremeMax.age += data.length;
        this._extremeMin.age += data.length;
        var isOld = this._extremeMax.age >= this._widthCapacity;
        isOld = isOld || this._extremeMin.age >= this._widthCapacity;
        if (isOld || !data.length) {
            newExtreme = this._getExtreme(Number.MAX_VALUE, -Number.MAX_VALUE, this._data);
        } else {
            newExtreme = this._getExtreme(this._extremeMin.value, this._extremeMax.value, data);
        }
        this._extremeMin = newExtreme.min;
        this._extremeMax = newExtreme.max;
    };
    
    p._getExtreme = function(min, max, data) {
        var currentMax = {value: max, age: this._widthCapacity};
        var currentMin = {value: min, age: this._widthCapacity};
        for (var i = 0; i < data.length; i++) {
            currentMax.value = Math.max(currentMax.value, data[i]);
            if (currentMax.value === data[i]) currentMax.age = data.length - i - 1;
            currentMin.value = Math.min(currentMin.value, data[i]);
            if (currentMin.value === data[i]) currentMin.age = data.length - i - 1;
        }
        return {min: currentMin, max: currentMax};
    };
    
    //  ---
    module.exports.StreamingChart = createjs.promote(StreamingChart, "Container");
}());
},{}],2:[function(require,module,exports){
(function (global){
const charts = require("../chart-lib.js");
/**
 * 
 * 
 */
global.init = function(canvasID) {
    var canvas = document.getElementById(canvasID);
    window.context = canvas.getContext("2d");
    
    var stage = new createjs.Stage(canvasID);
    createjs.Touch.enable(stage, false, true);
    createjs.Ticker.setFPS(60);
    createjs.Ticker.on("tick", stage.update.bind(stage));
    stage.preventSelection = false;
    
    testCharts(canvas, stage);
}
/**
 * 
 * 
 */
function handleResize(canvas, chartA0, chartB0, chartC0, textField) {
    var containerID = "container";
    var container = document.getElementById(containerID);
    window.addEventListener("resize", resizeCanvas, false);
    resizeCanvas();
    
    function resizeCanvas(e) {
        canvas.height = chartC0.getSize().height + chartC0.y + 25;
        var width = container.clientWidth - 50;
        chartA0.setComplexSize(width, chartA0.getSize().height);
        chartB0.setComplexSize(width, chartB0.getSize().height);
        chartC0.setComplexSize(width - 250, chartC0.getSize().height);
        textField.x = chartC0.x + chartC0.getSize().width + 25;
        textField.y = chartC0.y + 25;
        canvas.width = container.clientWidth;
    }
}

/**
 * 
 * 
 */
function testCharts(canvas, stage) {
    var chartA0 = stage.addChild(createChartA0(canvas));
    var chartB0 = stage.addChild(createChartB0(canvas));
    var chartC0 = stage.addChild(createChartC0(canvas));
    
    var textField = new createjs.Text("EMPTY", "16px Courier", "#000000");
    textField.lineHeight = 16;
    stage.addChild(textField);
    
    handleResize(canvas, chartA0, chartB0, chartC0, textField);
    
    createjs.Ticker.on("tick", function() {
        var text = "Last added: " + chartC0.getData()[chartC0.getData().length - 1];
        var extreme = chartC0.getExtreme();
        text += "\nLocal max: " + extreme.max.value;
        text += "\nLocal min: " + extreme.min.value;
        var localPoint = chartC0.globalToLocal(stage.mouseX, stage.mouseY);
        text += "\nLC [" + localPoint.x + ", " + localPoint.y + "]";
        text += "\nLP [" + chartC0.getIndexByLocalX(localPoint.x).toFixed(2) + ", " + chartC0.getValueByLocalY(localPoint.y).toFixed(2) + "]";
        text += "\nInterpolated: " + chartC0.getInterpolatedValueByLocalX(localPoint.x).toFixed(2);
        text += "\nLV [" + chartC0.getValueByLocalY(0).toFixed(2) + ", " + chartC0.getValueByLocalY(chartC0.getSize().height).toFixed(2) + "]";
        var pointSize = chartC0.getPoint();
        text += "\nPS [" + pointSize.width.toFixed(2) + ", " + pointSize.height.toFixed(2) + "]";
        textField.text = text;
    });
}

/**
 * 
 * 
 */
function createChartA0(canvas) {
    var size = {width: canvas.width - 50, height: 250};
    var point = {width: size.width / 70, height: 0.20};
    var axis = {offset: 0, isDynamic: true, dynamicSpace: {top: 10, bottom: 10}};
    var style = {
        background: {color: "rgba(0,170,255,0.1)"},
        grid: {thickness: 0.5, color: "rgba(0,255,255,0.33)", width: 5, height: 300, dash: [1, 0], offset: 0},
        axisX:  {thickness: 1, color: "#00FFFF"},
        chart: {
            lines: {thickness: 1, color: "#003333", dash: [1, 0], bounds: true},
            fill: {
                type: "linear", 
                isSymmetric: true,
                colors: ["rgba(0,255,255,0.25)", "rgba(0,255,255,0.05)", "rgba(0,255,255,0.25)"],
                ratios: [0, 0.50, 1],
                coords: [0, 0, 0, 1],
                bounds: false
            }
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
        if (chart.getCapacity() == chart.getDataLength()) {
            chart.setGridOffset(chart.getGridOffset() - 1);
        }
        t += 0.050;
    }, 50);
    
    return chart;
}

/**
 * 
 * 
 */
function createChartB0(canvas) {
    var size = {width: canvas.width - 50, height: 100};
    var point = {width: size.width / 50, height: 0.1};
    var axis = {offset: 0, isDynamic: false, dynamicSpace: {top: 0, bottom: 0}};
    var style = {
        background: {color: "#FF0000"},
        grid: {thickness: 10, color: "#FFFFFF", width: 0, height: 200, dash: [1, 0], offset: 0},
        axisX:  {thickness: 2, color: "#000000"},
        chart: {
            lines: {thickness: 2, color: "#000000", dash: [1, 0], bounds: false},
            points:  {thickness: 2, radius: 2, lineColor: "#000000", fillColor: "#FFFFFF", bounds: false},
            fill: {type: "solid", color: "rgba(255,0,0,0.5)", bounds: true}
        }
    };
    
    var chart = new charts.StreamingChart(size, point, axis, style);
    chart.y = 325;
    chart.x = 25;
    
    var t = 0;
    var shift = size.height / point.height / 2;
    setInterval(function() {
        chart.append([Math.cos(t) * 700 + shift]);
        t += 0.50;
    }, 250);
    
    return chart;
}

/**
 * 
 * 
 */
function createChartC0(canvas) {
    var size = {width: canvas.width - 300, height: 200};
    var point = {width: 1, height: 1};
    var axis = {offset: 0, isDynamic: true, dynamicSpace: {top: 0, bottom: 100}};
    var style = {
        background: {color: "rgba(255,255,255,0)"},
        axisX:  {thickness: 1, color: "#00FF00"},
        chart: {
            lines: {thickness: 4, color: "rgba(102,214,102,1)", dash: [1, 0], bounds: false},
            points:  {thickness: 6, radius: 12, lineColor: "#FFFFFF", fillColor: "#00BB00", bounds: false},
            fill: {type: "solid", color: "rgba(102,214,102,1)", bounds: true}
        }
    };
    
    var chart = new charts.StreamingChart(size, point, axis, style);
    chart.y = 475;
    chart.x = 25;
    
    (function() {
        var req = new XMLHttpRequest();
        req.open("GET", "test.json", true);
        req.addEventListener("load", reqCompleteHandler, false);
        req.addEventListener("error", reqErrorHandler, false);
        req.send();
    })();
    
    function reqCompleteHandler(e) {
        var req = e.target;
        var data = JSON.parse(req.responseText);
        
        var pLength = 10;
        chart.setPoint(size.width / (pLength - 1), chart.getPoint().height);
        chart.redraw();
        chart.append(data.splice(0, pLength));
        
        var t = 0;
        var interval = setInterval(function() {
            if (t == data.length) {
                clearInterval(interval);
                return;
            }
            chart.append(data[t]);
            t ++;
        }, 1500);
        
        req.removeEventListener("load", reqCompleteHandler, false);
        req.removeEventListener("error", reqErrorHandler, false);
    }
    
    function reqErrorHandler(e) {
        alert(req.status + ": " + req.statusText);
        var req = e.target;
        req.removeEventListener("load", reqCompleteHandler, false);
        req.removeEventListener("error", reqErrorHandler, false);
    }
    
    return chart;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../chart-lib.js":1}]},{},[2]);
