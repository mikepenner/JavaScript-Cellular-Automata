// parameters
var width = 1200;
var height = 800;
var cellSize = 5;
var pauseMS = 10;
var stateCount = 4;
var birthStates = [2];
var survivalStates = [3,4,5];
var minRectX = minRectY = 20;

// internal vars
var canvas, context = null;
var cells;
var onState = stateCount - 1;
var offState = 0;
var isPaused = false;
var downX, downY, upX, upY;

function init() {
    canvas = document.getElementById("id.caCanvas");
    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext("2d")
    context.font = '18px sans-serif';
    context.save();

    cellCountX = width / cellSize;
    cellCountY = height / cellSize;
    onState = stateCount - 1;
    cells = new Array();
    randomizeCells();    
    render();
}

var render = function () {
    if (!isPaused) {
        context.clearRect(0, 0, width, height);
        updateCells();
        context.beginPath();
        for(x = 0; x < cellCountX; x++) {
            for(y = 0; y < cellCountY; y++) {
                fillCell(x,y,cells[x][y]);
            }
        }
        if (downX > -1 && downY > -1 && upX > -1 && upY > -1 && upX-downX > minRectX && upY-downY > minRectY) {
            drawCropBox();
        }
        context.stroke();
    }
    setTimeout(render, pauseMS);
};

function drawCropBox() {
    context.fillStyle = "rgba(0,0,0,0.5)"
    pos = findPos(canvas);
    context.fillRect(downX-pos[0],downY-pos[1],upX-downX,upY-downY);
    context.fillStyle = "rgb(0,0,0)";
    s = '('+downX+','+downY+') - ('+upX+','+upY+') pos ('+pos[0]+','+pos[1]+')';
    context.fillText(s,downX,downY+20);
}

function randomizeCells() {
    for(x = 0; x < cellCountX; x++) {
        cells[x] = new Array();
        for(y = 0; y < cellCountY; y++) {
            var r = Math.floor(Math.random()*2);
            cells[x][y] = r < 1 ? offState : onState;
        }
    }
}

function updateCells() {
    var tempCells = new Array();
    for(x = 0; x < cellCountX; x++) {
        tempCells[x] = new Array();
        for(y = 0; y < cellCountY; y++) {
            tempCells[x][y] = nextState(x,y,cells);
        }
    }
    for(x = 0; x < cellCountX; x++) {
        for(y = 0; y < cellCountY; y++) {
            cells[x][y] = tempCells[x][y];
        }
    }
}

function nextState(x,y,c) {
    var neighbourCount = countNeighbours(x,y,c);
    if (c[x][y] == onState) {
        if (arrayContainsValue(survivalStates,neighbourCount)) {
            return onState;
        }
        return onState - 1;
    }
    if (c[x][y] > 0) {
        return c[x][y] - 1;
    }
    if (arrayContainsValue(birthStates,neighbourCount)) {
        return onState;
    }
    return offState;
}

function arrayContainsValue(a,v) {
    for(i = 0; i < a.length; i++) {
        if (v == a[i]) {
            return true;
        }
    }
    return false;
}

function countNeighbours(x,y,c) {
    return count(x-1,y-1,c) + count(x-1,y  ,c) + count(x-1,y+1,c)
         + count(x  ,y-1,c)                    + count(x  ,y+1,c)
         + count(x+1,y-1,c) + count(x+1,y  ,c) + count(x+1,y+1,c);
}

function count(x,y,c) {
    if(x < 0 || x >= c.length || y < 0 || y >= c[0].length) { return 0; }
    return c[x][y] == onState ? 1 : 0;
}

function fillCell(x, y, cellState) {
    if (cellState > 0) {    
        var r = 255 - (cellState * (255 / onState));
        context.fillStyle = "rgb(255,"+r+","+r+")";
    } else {
        context.fillStyle = "rgb(255,255,255)";
    }
    context.fillRect(x * cellSize, y * cellSize, cellSize-1, cellSize-1);
}

function findPos(obj) {
    var curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    return [curleft,curtop];
}

function mousedown() {
    downX = event.clientX;
    downY = event.clientY;
    upX = -1;
    upY = -1;
}
function mouseup() {
    upX = event.clientX;
    upY = event.clientY;
    if (upX-downX > minRectX && upY-downY > minRectY) {
        document.getElementById("id.crop").style.display="inline";
        drawCropBox();
    } else {
        document.getElementById("id.crop").style.display="none";
    }
}

function crop() {
    var pos = findPos(canvas);
    var cropX1 = Math.floor((downX - pos[0]) / cellSize);
    var cropY1 = Math.floor((downY - pos[1]) / cellSize);
    var cropX2 = Math.floor((upX - pos[0]) / cellSize);
    var cropY2 = Math.floor((upY - pos[1]) / cellSize);
    var w = cropX2 - cropX1;
    var h = cropY2 - cropY1;
    var woffset = Math.floor((cellCountX - w) / 2);
    var hoffset = Math.floor((cellCountY - h) / 2);

    //    var s = 'pos[0]='+pos[0]+',pos[1]='+pos[1]+',cropX1='+cropX1+'cropY1='+cropY1+',cropX2='+cropX2+',cropY2='+cropY2+',w='+w+',h='+h+',woffset='+woffset+',hoffset='+hoffset;
    //alert('crop:'+s);

    // create and populate temp array
    var temp = new Array();
    for(i = 0; i < w; i++) {
        temp[i] = new Array();
        for(j = 0; j< h; j++) {
            temp[i][j] = cells[cropX1+i][cropY1+j];
        }
    }
    // clear cells
    for(i = 0; i < cellCountX; i++) {
        for(j = 0; j < cellCountY; j++) {
            cells[i][j] = offState;
        }
    }
    // push temp array into cells
    for(i = 0; i < w; i++) {
        for(j = 0; j < h; j++) {
            cells[i+woffset][j+hoffset] = temp[i][j];
        }
    }

    isPaused = true;
    togglePause();
    downX = downY = upX = upY = 0;
    document.getElementById("id.crop").style.display="none";
}
