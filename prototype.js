// var width = container.offsetWidth;
// var height = container.offsetHeight;
// var gridWidth = 20;
// var gridHeight = 20;
// var fps = 3;

// var paused = true;
// var toroidal = false;
// var randomize = false;

// var animationId = null;
// var timeoutId = null;

// var gridDomCache = [];
// var grid = [];

// var directions = [
//     {x: 0 , y: -1 }, //N
//     {x: 1 , y: -1 }, //NE
//     {x: 1 , y:  0 }, //E
//     {x: 1 , y:  1 }, //SE
//     {x: 0 , y:  1 }, //S
//     {x:-1 , y:  1 }, //SW
//     {x:-1 , y:  0 }, //W
//     {x:-1 , y: -1 }, //NW
// ];

// function setup() {

//     var buttonList = document.getElementsByTagName('button');

//     var playButton = document.getElementById('play');
//     var pauseButton = document.getElementById('pause');
//     var restartButton = document.getElementById('restart');
//     var toroidalButton = document.getElementById('toroidal_button');
//     var randomizeButton = document.getElementById('randomize');

//     var widthSlider = document.getElementById('width_slider');
//     var heightSlider = document.getElementById('height_slider');
//     var speedSlider = document.getElementById('speed_slider');

//     var widthLabel = document.getElementById('width_label');
//     var heightLabel = document.getElementById('height_label');
//     var speed_label = document.getElementById('speed_label');
//     var currentlyInPlayingGame = false;

//     function toggle() {
//         this.classList.toggle('on');
//         this.classList.toggle('off');
//     }
//     function updateButtons() {
        
//         if(currentlyInPlayingGame) {
//             if(timeoutId) {

//                 playButton.classList.remove('off')
//                 playButton.classList.add('clicked')      
//                 pauseButton.classList.remove('clicked')   
//                 pauseButton.classList.add('off')   
    
//             } else {
    
//                 pauseButton.classList.remove('off')
//                 pauseButton.classList.add('clicked')      
//                 playButton.classList.remove('clicked')   
//                 playButton.classList.add('off')   
    
//             }
//         } else {
//             playButton.classList.remove('clicked');
//             playButton.classList.add('off');

//             pauseButton.classList.remove('clicked');
//             pauseButton.classList.add('off');
//         }

//         if(toroidal) {
//             toroidalButton.classList.remove('off')
//             toroidalButton.classList.add('clicked')            
//         } else {
//             toroidalButton.classList.remove('clicked')   
//             toroidalButton.classList.add('off')
//         }

//         if(randomize) {
//             randomizeButton.classList.remove('off')
//             randomizeButton.classList.add('clicked')            
//         } else {
//             randomizeButton.classList.remove('clicked')   
//             randomizeButton.classList.add('off')
//         }
            
//     }

//     function updateControls() {
//         removeAllChildren(widthLabel);
//         addTextToDiv(widthLabel, gridWidth);
//         gridWidth = parseInt(gridWidth);

//         removeAllChildren(heightLabel);
//         addTextToDiv(heightLabel, gridHeight);
//         gridHeight = parseInt(gridHeight);

//         removeAllChildren(speed_label);
//         addTextToDiv(speed_label, fps);
//         fps = parseInt(fps);
//     }

//     function widthChange() { setWidth(this.value); updateControls(); };
//     function heightChange() { setHeight(this.value); updateControls(); };
//     function speedChange () { setSpeed(this.value); updateControls(); };

//     function setupListeners() {
//         playButton.addEventListener('click', () => { play(); currentlyInPlayingGame = true; });
//         pauseButton.addEventListener('click', pause);
//         restartButton.addEventListener('click', () => { restart(); currentlyInPlayingGame = false; });
//         toroidalButton.addEventListener('click', toggleToroidal);
//         randomizeButton.addEventListener('click', () => { toggleRandomize(); currentlyInPlayingGame = false; });
    
//         widthSlider.oninput = widthChange;
//         heightSlider.oninput = heightChange;
//         speedSlider.oninput = speedChange;

//         for(button of buttonList) { 
//             button.addEventListener('mousedown', toggle);
//             button.addEventListener('click', toggle);
//             button.addEventListener('click', updateButtons);
//          }
//     }
//     function cleanupListeners() {
//         playButton.removeEventListener('click', play);
//         pauseButton.removeEventListener('click', pause);
//         restartButton.removeEventListener('click', restart);
//         toroidalButton.removeEventListener('click', toggleToroidal);
//         randomizeButton.removeEventListener('click', toggleRandomize);
    
//         widthSlider.removeEventListener('oninput', widthChange);
//         heightSlider.removeEventListener('oninput', heightChange);
//         speedSlider.removeEventListener('oninput', speedChange);

//         for(button of buttonList) { 
//             button.removeEventListener('mousedown', toggle);
//             button.removeEventListener('click', toggle);
//             button.removeEventListener('click', updateButtons);
//          }
//     }

    

//     setupListeners();
// }




// function handleElementClick(x, y) {
//     toggleElement(x, y);
//     grid[x][y] = !grid[x][y]
// }
// function createElement(x, y) {
//     var elt = document.createElement('div');

//     if(randomize) {
//         elt.classList.add( (0.5 >= Math.random())? 'alive': 'dead' );
//     } else {
//         elt.classList.add( 'dead' );
//     }
//     elt.style['width'] = width/gridWidth;
//     elt.style['height'] = height/gridHeight;
//     elt.addEventListener('click', handleElementClick.bind(null, x, y));

//     return elt;
// }
// function drawInitialGrid() {
//     for(var x = 0; x < gridWidth; x++) {

//         gridDomCache[x] = [];
//         grid[x] = []; 

//         for(var y = 0; y < gridHeight; y++) {

//             var elt = createElement(x, y);
//             container.appendChild(elt);

//             gridDomCache[x].push(elt);
//             grid[x].push(elt.classList.contains('alive'));

//         }
//     }
// }
// function getElement(x, y) { return gridDomCache[x][y]; }
// function toggleElement(x, y) {

//     var element = gridDomCache[x][y];

//     if(element.classList.contains('alive')) {
//         element.classList.remove('alive');
//         element.classList.add('dead');
//     } else {
//         element.classList.remove('dead');
//         element.classList.add('alive');
//     }

// }
// function getLiveNeighborCount(x, y) {
//     return directions.reduce(function(total, dir) {

//         var x_delta = x + dir.x;
//         var y_delta = y + dir.y;

//         if(x_delta >= 0 && x_delta < gridWidth && y_delta >= 0 && y_delta <= gridHeight) {
//             if (grid[x_delta][y_delta]) {
//                 return total + 1;
//             } 
//         } 
        
//         return total;

//     }, 0);
// }
// function getToroidalNeighborCount(x, y) {
//     return this.directions.reduce(function(total, dir) {

//         var x_delta = x;
//         var y_delta = y;

//         x_delta = (x_delta + dir.x)%gridWidth;
//         y_delta = (y_delta + dir.y)%gridWidth;

//         if(x_delta < 0)
//             x_delta = gridWidth + x_delta;
//         if(y_delta < 0) 
//             y_delta = gridHeight + y_delta;
//         if (grid[x_delta][y_delta]) {
//             return total + 1;
//         } 

//         return total;

//     }, 0);
// }
// function updateGrid() {
//     for(var x = 0; x < gridWidth; x++) {
//         for(var y = 0; y < gridHeight; y++) {
//             var liveCount = (toroidal)? 
//                 getToroidalNeighborCount(x,y) :
//                 getLiveNeighborCount(x,y);

//             if(grid[x][y] && (liveCount === 2 || liveCount === 3) ) {
//                 //No-op, cell stays alive
//             }
//             else if( (!grid[x][y]) && liveCount === 3) {
//                 toggleElement(x, y);
//             }
//             else if(grid[x][y] && (liveCount < 2 || liveCount > 3)) {
//                 toggleElement(x, y);
//             }
//         }
//     }
// }
// function updateGridData() {
//     for(var x = 0; x < gridWidth; x++) {
//         for(var y = 0; y < gridHeight; y++) {
//             grid[x][y] = gridDomCache[x][y].classList.contains('alive');
//         }
//     }
// }
// function render() {  
//     updateGrid();
//     updateGridData();
// }
// function play() {
//     render();

//     //Remake the animation ids each time so that
//     //play variable doesn't stack upon itself
//     clearInterval(timeoutId);
//     cancelAnimationFrame(animationId);

//     timeoutId = setTimeout(function() {
//         animationId = requestAnimationFrame(play);
//     }, 1000/ fps);
// }
// function pause() {
//     clearInterval(timeoutId);
//     cancelAnimationFrame(animationId);
//     timeoutId = null;
//     animationId = null;
// }
// function restart() {
//     clearInterval(timeoutId);
//     cancelAnimationFrame(animationId);
//     timeoutId = null;
//     animationId = null;
//     removeAllChildren(container);
//     drawInitialGrid();
// }
// function setWidth(value) {
//     gridWidth = value;
//     restart();
// }
// function setHeight(value) {
//     gridHeight = value;
//     restart();
// }
// function setSpeed(value) {
//     fps = value;
// }
// function toggleToroidal() {
//     toroidal = !toroidal;
// }
// function toggleRandomize() {
//     randomize = !randomize;
//     restart();
// }

// setup();
// drawInitialGrid();
