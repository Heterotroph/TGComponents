/**
 * @author R.Akhtyamov
 * https://github.com/Heterotroph/StreamingChart
 */

var charts = {};

(function() {

    /**
     *  Streaming chart.
     *  @constructor
     *  @param {object} size - Chart size as an object in pixels. Example: {width: 1000, height: 400}
     *  @param {object} point - Point size as an object in pixels. Example: {width: 50, height: 1}
     *  @param {object} axis - Axis parameters. Example: {offset: 0, dynamicSpace: {top: 10, bottom: 0}, isDynamic: false}
     *  @param {object} style - Visual parameters. Example:
     *    {
     *        background: {color: "#000000", alpha: 0.5},
     *        grid: {thickness: 1, color: "#00FFFF", alpha: 1, width: 1, height: 20, dash: [1, 0], offset: 0},
     *        axisX:  {thickness: 1, color: "rgba(0,0,0,.9)", alpha: 1, offset: 0},
     *        chart: {
     *            lines: {thickness: 3, color: "#000000", alpha: 0.8, bounds: true},
     *            points:  {thickness: 3, radius: 2, lineColor: "#0000FF", fillColor: "#FF0000", alpha: 0.8, bounds: true}
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
    //  PUBLIC METHODS
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
        if (count === 0)  return;
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
        this._moveAxisX(this._style.axisX.offset);
    };
    
    /**
     * Redraw all
     */
    p.redraw = function() {
        if (this._data.length > 0) this.set(this._data);
        this._drawBackgroundShape(this._size, this._style.background);
        this._updateGrid(this._style.grid);
        this._drawAxisX(this._style.axisX);
        this._updateMask(this._style.chart.lines.bounds, this._size.width, this._size.height);
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
    //  PRIVATE METHODS (VIEW)
    //
    
    p._drawChart = function(offsetX, stepX, data, style) {
        var aX, aY, bX, bY;
        aX = offsetX;
        aY = this._applyOffset(data[0]) * this._dynamicPoint.height;
        this._chartShape.graphics.setStrokeStyle(style.lines.thickness, 1, 1, 0, true).beginStroke(style.lines.color);
        this._pointShape.graphics.setStrokeStyle(style.points.thickness).beginStroke(style.points.lineColor);
        if (offsetX === 0) this._drawPoint(0, Math.round(aY), style.points);
        for (var i = 0; i < data.length - 1; i++) {
            bX = Math.round(offsetX + stepX * (i + 1));
            bY = Math.round(this._applyOffset(data[i + 1]) * this._dynamicPoint.height);
            this._drawSegment(aX, aY, bX, bY, style.lines);
            this._drawPoint(bX, bY, style.points);
            aX = bX;
            aY = bY;
        }
        this._chartShape.graphics.endStroke();
        this._pointShape.graphics.endStroke();
    };
    
    p._drawSegment = function(aX, aY, bX, bY, style) {
        var graphics = this._chartShape.graphics;
        graphics.moveTo(aX, this._size.height - aY).lineTo(bX, this._size.height - bY);
    };
    
    p._drawPoint = function(x, y, style) {
        var graphics = this._pointShape.graphics;
        if (style.radius === 0 || style.alpha === 0) return;
        if (style.bounds && !this._isInsideBounds(x, y)) return;
        graphics.beginFill(style.fillColor);
        graphics.drawCircle(x, this._size.height - y, style.radius);
        graphics.endFill();
    };
    
    p._drawBackgroundShape = function(size, style) {
        var graphics = this._backgroundShape.graphics.clear();
        if (style.alpha === 0) return;
        graphics.beginFill(style.color);
        graphics.drawRoundRect(0, 0, size.width, size.height, 3);
        this._backgroundShape.alpha = style.alpha;
    };
    
    p._updateGrid = function(style) {
        var stepX = this._dynamicPoint.width * this._style.grid.width;
        var startX = style.offset * this._dynamicPoint.width % stepX;
        startX = startX === 0 ? stepX : startX;
        var stepY = this._dynamicPoint.height * this._style.grid.height;
        this._drawGridShape(stepX, startX, stepY, style);
    };
    
    p._drawGridShape = function(stepX, startX, stepY, style) {
        var graphics = this._gridShape.graphics.clear();
        if (style.alpha === 0) return;
        graphics.setStrokeDash(style.dash);
        graphics.setStrokeStyle(style.thickness).beginStroke(style.color);
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
        this._gridShape.alpha = style.alpha;
    };
    
    p._updateMask = function(bounds, width, height) {
        if (bounds) {
            this._drawMaskShape(0, 0, width, height);
        } else {
            this._chartShape.mask = null;
        }
    };
    
    p._drawMaskShape = function(x, y, width, height) {
        this._chartShape.mask = new createjs.Shape();
        this._chartShape.mask.graphics.beginFill("#000000");
        this._chartShape.mask.graphics.drawRect(x, y, width, height);
    };
    
    p._drawLevelLine = function(shape, thickness, color) {
        var graphics = shape.graphics.clear();
        graphics.setStrokeStyle(thickness).beginStroke(color);
        graphics.moveTo(0, 0).lineTo(this._size.width, 0).endStroke();
    };
    
    p._drawAxisX = function(style) {
        if (style.alpha === 0) return;
        this._axisXShape.alpha = style.alpha;
        this._drawLevelLine(this._axisXShape, style.thickness, style.color);
        this._moveAxisX(style.offset);
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
        this._moveAxisX(this._style.axisX.offset);
    };
    
    p._clearChartAndPoints = function() {
        this._chartShape.graphics.clear();
        this._pointShape.graphics.clear();
    };
    
    //
    //  PRIVATE METHODS (UTILS)
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
    charts.StreamingChart = createjs.promote(StreamingChart, "Container");
}());
