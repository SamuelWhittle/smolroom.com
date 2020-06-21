//-----------Functions-----------
// Sets canvas size to be relative to the chrome window
function adjustCanvasSize() {
    c.width = c.offsetWidth;
    c.height = c.offsetHeight;
}

// draw the current point in time on the canvas
function draw() {
    // Make sure the canvas is the right size in pixels to match the parent div in the html
    adjustCanvasSize();

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.fillStyle = "#FF0000";
    ctx.fillRect(timelineInput.value/100*(c.width-50), 10, 50, 50);
}

// Redraws canvas based on selected time
function redrawTime() {
    //idk change somehow dependant on timeline? I'll figure it out later.
    draw();
}

// Where the things happen
function main() {
    // Make sure canvas is the right size
    adjustCanvasSize();

    // perlinNoise([dim1, dim2, dim3, ..., dimN(in pixels), gridStep, numOctaves, octaveScale])
    var noise = new perlinNoise([c.width, c.height, 100, 30, 4, 1/2]);

    draw();
}

//----------HTML Elements-----------
// Get Canvas
var c = document.getElementById("mainCanvas");
var ctx = c.getContext("2d");

// Get Input Slider
var timelineInput = document.getElementById("timeline");

//----------Event Listeners-----------
// Window Resize
window.addEventListener('resize', draw);

// Timeline move
timelineInput.addEventListener('input', redrawTime);

//----------Do The Things-----------
main();