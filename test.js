function init() {
    handleResizing();
    testComponents();
}

function handleResizing() {
    var
    canvas = document.getElementById("c"),
    context = canvas.getContext("2d");
                
    initialize();
                
    function initialize() {
        window.addEventListener("resize", resizeCanvas, false);
        resizeCanvas();
    }
            
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

function testComponents() {
    var stage = new createjs.Stage("c");
    stage.enableMouseOver();
      			
    var size = {width: 600, height: 400};
  	var segments = {multiplier: 0.1, countX: 10, minCountY: 10, maxCountShift: 1};
  	var style = {
        background: {color: "#00AAFF", alpha: 0.1},
        axis: {thickness: 2, color: "#00FFFF", alpha: 0.8},
        grid: {thickness: 0.5, color: "#00FFFF", alpha: 0.5},
        chart: {thickness: 3, radius: 4, color: "#000000", alpha: 0.8}
    };
    var chart = stage.addChild(new tgc.Chart(size, segments, style));
    chart.y = 50;
    chart.x = 50;
    chart.append([300, 300, 800, 1000, 700, 880, 1000, 800, 700, 500]);
      			
    createjs.Ticker.on("tick", stage);
}