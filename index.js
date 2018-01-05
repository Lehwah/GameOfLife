var saved_projects = [];

function removeAllChildren(domElement) {
    while (domElement.hasChildNodes()) {
        domElement.removeChild(domElement.lastChild);
    }
}
function addTextToDiv(div, value) {
    div.appendChild(document.createTextNode(value));
}
function shapeNormalizer(shape) {
    var newShape = [];
    for(var x = 0; x < shape.length; x ++) {
        newShape[x] = [];
        for(var y = 0; y < shape[0].length; y++) {
            newShape[x][y] = shape[y][x];
        }
    }
    return newShape;
}
function cloneGrid(grid) {
    var width = grid.length;
    var height = grid[0].length;
    var gridClone = [];

    for(var x = 0; x < width; x++) {
        gridClone[x] = [];
        for(var y = 0; y < height; y++) {
            gridClone[x][y] = grid[x][y];
        }
    }
    return gridClone;
}

class DisplayGrid {
    constructor(container, gridWidth = 20, gridHeight = 20, grid = []) {
        //Is there a way to do a validation check to ensure
        //We actually make a container that is valid (or exists)
        this.container = container;
        this.width = container.offsetWidth;
        this.height = container.offsetHeight;

        this.gridWidth = 20;
        this.gridHeight = 20;

        this.fps = 3;

        this.animationId = null;
        this.timeoutId = null;

        this.gridDomCache = [];
        this.grid = grid;//needs to be optimized later

        this.directions = [
            {x: 0 , y: -1 }, //N
            {x: 1 , y: -1 }, //NE
            {x: 1 , y:  0 }, //E
            {x: 1 , y:  1 }, //SE
            {x: 0 , y:  1 }, //S
            {x:-1 , y:  1 }, //SW
            {x:-1 , y:  0 }, //W
            {x:-1 , y: -1 }, //NW
        ];
    }
    createElement(x, y, isAlive) {
        var elt = document.createElement('div');

        elt.classList.add( (isAlive)? 'alive': 'dead' );
        elt.style['width'] = this.width/this.gridWidth;
        elt.style['height'] = this.height/this.gridHeight;

        return elt;
    }
    loadGrid(grid) {
        this.grid = grid;
        this.gridWidth = grid.length;
        this.gridHeight = grid[0].length;
        this.gridDomCache = [];
        removeAllChildren(this.container);

        for(var x = 0; x < this.gridWidth; x++) {

            this.gridDomCache[x] = [];

            for(var y = 0; y < this.gridHeight; y++) {
                var elt = this.createElement(x, y, this.grid[x][y]);
                this.gridDomCache[x].push(elt);
                this.container.appendChild(elt);
            }
        }
    }
}
class AnimatedGrid extends DisplayGrid {
    constructor(container, gridWidth, gridHeight, grid) {
        super(container, gridWidth, gridHeight, grid);
    }
    toggleElement(x,y) {
        var element = this.gridDomCache[x][y];

        if(element.classList.contains('alive')) {
            element.classList.remove('alive');
            element.classList.add('dead');
        } else {
            element.classList.remove('dead');
            element.classList.add('alive');
        }
    }
    
    getLiveNeighborCount(x, y) {
        return this.directions.reduce(function(total, dir) {

            var x_delta = x + dir.x;
            var y_delta = y + dir.y;
    
            if(x_delta >= 0 && x_delta < this.gridWidth && y_delta >= 0 && y_delta <= this.gridHeight) {
                if (this.grid[x_delta][y_delta]) {
                    return total + 1;
                } 
            } 
            
            return total;
    
        }.bind(this), 0);
    }
    updateGrid() {
        for(var x = 0; x < this.gridWidth; x++) {
            for(var y = 0; y < this.gridHeight; y++) {
                var liveCount = this.getLiveNeighborCount(x,y);
    
                if(this.grid[x][y] && (liveCount === 2 || liveCount === 3) ) {
                    //No-op, cell stays alive
                }
                else if( (!this.grid[x][y]) && liveCount === 3) {
                    this.toggleElement(x, y);
                }
                else if(this.grid[x][y] && (liveCount < 2 || liveCount > 3)) {
                    this.toggleElement(x, y);
                }
            }
        }
    }
    updateGridData() {
        for(var x = 0; x < this.gridWidth; x++) {
            for(var y = 0; y < this.gridHeight; y++) {
                this.grid[x][y] = this.gridDomCache[x][y].classList.contains('alive');
            }
        }
    }
    render() {
        this.updateGrid();
        this.updateGridData();
    }
    play() {
        this.render();

        //Remake the animation ids each time so that
        //play variable doesn't stack upon itself
        clearInterval(this.timeoutId);
        cancelAnimationFrame(this.animationId);

        this.timeoutId = setTimeout(function() {
            this.animationId = requestAnimationFrame(this.play.bind(this));
        }.bind(this), 1000/ this.fps);
    }
    pause() {
        clearInterval(this.timeoutId);
        cancelAnimationFrame(this.animationId);
        this.timeoutId = null;
        this.animationId = null;
    }
    reset() { //Update this to render the new 'drawInitialGrid' which will have a display based on the underlying grid data passed in it's constructor
        clearInterval(this.timeoutId);
        cancelAnimationFrame(this.animationId);
        this.timeoutId = null;
        this.animationId = null;
        this.grid = [];
        removeAllChildren(this.container);
        this.drawInitialGrid();
    }
}
class GameGrid extends AnimatedGrid {
    constructor(container, gridWidth, gridHeight, grid) {
        super(container, gridWidth, gridHeight, grid);

        this.toroidal = false;
        this.randomize = false;

        this.customClickEnabled = false;
        this.customPattern = [];
    }
    handleElementClick(x, y) {
        if(this.customClickEnabled) {
            this.handleCustomClick(x,y);
            return;
        }
    
        this.toggleElement(x, y);
        this.grid[x][y] = !this.grid[x][y];
    }
    createElement(x, y, isAlive) {
        var elt = document.createElement('div');

        elt.classList.add( (isAlive)? 'alive': 'dead' );
        elt.style['width'] = this.width/this.gridWidth;
        elt.style['height'] = this.height/this.gridHeight;
        elt.addEventListener('click', this.handleElementClick.bind(this, x, y));

        return elt;
    }
    getToroidalNeighborCount(x, y) {
        return this.directions.reduce(function(total, dir) {

            var x_delta = x;
            var y_delta = y;
    
            x_delta = (x_delta + dir.x)%this.gridWidth;
            y_delta = (y_delta + dir.y)%this.gridWidth;
    
            if(x_delta < 0)
                x_delta = this.gridWidth + x_delta;
            if(y_delta < 0) 
                y_delta = this.gridHeight + y_delta;
            if (this.grid[x_delta][y_delta]) {
                return total + 1;
            } 
    
            return total;
    
        }.bind(this), 0);
    }
    updateGrid() {
        for(var x = 0; x < this.gridWidth; x++) {
            for(var y = 0; y < this.gridHeight; y++) {
                var liveCount = (this.toroidal)? 
                    this.getToroidalNeighborCount(x,y):
                    this.getLiveNeighborCount(x,y);
    
                if(this.grid[x][y] && (liveCount === 2 || liveCount === 3) ) {
                    //No-op, cell stays alive
                }
                else if( (!this.grid[x][y]) && liveCount === 3) {
                    this.toggleElement(x, y);
                }
                else if(this.grid[x][y] && (liveCount < 2 || liveCount > 3)) {
                    this.toggleElement(x, y);
                }
            }
        }
    }
    drawInitialGrid() {
        for(var x = 0; x < this.gridWidth; x++) {

            this.gridDomCache[x] = [];
            this.grid[x] = []; 
    
            for(var y = 0; y < this.gridHeight; y++) {
                if(this.randomize) {
                    this.grid[x].push((0.5 >= Math.random()));
                } else {
                    this.grid[x].push(false);
                }
                
                var elt = this.createElement(x, y, this.grid[x][y]);
                this.gridDomCache[x].push(elt);
                this.container.appendChild(elt);
            }
        }
    }
    setWidth(width) {
        this.gridWidth = width;
        this.restart();
    }
    setHeight(height) {
        this.gridHeight = height;
        this.restart();
    }
    setSpeed(fps) {
        this.fps = fps;
    }
    restart() {
        clearInterval(this.timeoutId);
        cancelAnimationFrame(this.animationId);
        this.timeoutId = null;
        this.animationId = null;
        this.grid = [];
        removeAllChildren(this.container);
        this.drawInitialGrid();
    }
    toggleToroidal() {
        this.toroidal = !this.toroidal;
    }
    toggleRandomize() {
        this.randomize = !this.randomize;
        this.restart();
    }
    handleCustomClick(x, y) {
        var miniGrid = this.customPattern;
        var miniGridWidth = miniGrid.length;
        var miniGridHeight = miniGrid[0].length;
    
        var xStart = Math.floor(x - miniGridWidth/2 + 1),
            xEnd = Math.floor(x + miniGridWidth/2),
            yStart = Math.floor(y - miniGridHeight/2 + 1),
            yEnd = Math.floor(y + miniGridHeight/2);
    
        for(var newX = xStart; newX <= xEnd; newX++) {
            for(var newY = yStart; newY <= yEnd; newY++) {
                if(newX >= 0 && newX < this.gridWidth && newY >= 0 && newY < this.gridHeight) {
    
                    var miniX = newX - xStart, miniY = newY - yStart;
                    
                    if(miniGrid[miniX][miniY]) {
                        this.grid[newX][newY] = miniGrid[miniX][miniY];
                        this.gridDomCache[newX][newY].classList.remove('alive');
                        this.gridDomCache[newX][newY].classList.remove('dead');
                        this.gridDomCache[newX][newY].classList.add( (this.grid[newX][newY])? 'alive': 'dead');
                    }
    
                }
            }
        }
    
    }
    saveGridSnapshot() {
        return this.grid;
    }
}

function setup(gameGrid) {
    var doc = document;

    var container = doc.getElementById('container');

    var buttonList = doc.getElementsByTagName('button');

    var playButton = doc.getElementById('play');
    var pauseButton = doc.getElementById('pause');
    var restartButton = doc.getElementById('restart');
    var toroidalButton = doc.getElementById('toroidal_button');
    var randomizeButton = doc.getElementById('randomize');

    var widthSlider = doc.getElementById('width_slider');
    var heightSlider = doc.getElementById('height_slider');
    var speedSlider = doc.getElementById('speed_slider');

    var widthLabel = doc.getElementById('width_label');
    var heightLabel = doc.getElementById('height_label');
    var speed_label = doc.getElementById('speed_label');
    var currentlyInPlayingGame = false;

    // var grid = new GameGrid(container);
    var grid = gameGrid;

    function toggle() {
        this.classList.toggle('on');
        this.classList.toggle('off');
    }
    function updateButtons() {
        
        if(currentlyInPlayingGame) {
            if(grid.timeoutId) {

                playButton.classList.remove('off')
                playButton.classList.add('clicked')      
                pauseButton.classList.remove('clicked')   
                pauseButton.classList.add('off')   
    
            } else {
    
                pauseButton.classList.remove('off')
                pauseButton.classList.add('clicked')      
                playButton.classList.remove('clicked')   
                playButton.classList.add('off')   
    
            }
        } else {
            playButton.classList.remove('clicked');
            playButton.classList.add('off');

            pauseButton.classList.remove('clicked');
            pauseButton.classList.add('off');
        }

        if(grid.toroidal) {
            toroidalButton.classList.remove('off')
            toroidalButton.classList.add('clicked')            
        } else {
            toroidalButton.classList.remove('clicked')   
            toroidalButton.classList.add('off')
        }

        if(grid.randomize) {
            randomizeButton.classList.remove('off')
            randomizeButton.classList.add('clicked')            
        } else {
            randomizeButton.classList.remove('clicked')   
            randomizeButton.classList.add('off')
        }
            
    }
    function updateControls() {
        removeAllChildren(widthLabel);
        addTextToDiv(widthLabel, grid.gridWidth);
        grid.gridWidth = parseInt(grid.gridWidth);

        removeAllChildren(heightLabel);
        addTextToDiv(heightLabel, grid.gridHeight);
        grid.gridHeight = parseInt(grid.gridHeight);

        removeAllChildren(speed_label);
        addTextToDiv(speed_label, grid.fps);
        grid.fps = parseInt(grid.fps);
    }

    function handlePlay() { grid.play(); currentlyInPlayingGame = true; };
    function handleRestart() { grid.restart(); currentlyInPlayingGame = false; };
    function handleRandomize() { grid.toggleRandomize(); currentlyInPlayingGame = false; };
    function widthChange() { grid.setWidth(this.value); updateControls(); };
    function heightChange() { grid.setHeight(this.value); updateControls(); };
    function speedChange () { grid.setSpeed(this.value); updateControls(); };

    function setupListeners() {
        playButton.addEventListener('click', handlePlay);
        pauseButton.addEventListener('click', grid.pause.bind(grid));
        restartButton.addEventListener('click', handleRestart);
        toroidalButton.addEventListener('click', grid.toggleToroidal.bind(grid));
        randomizeButton.addEventListener('click', handleRandomize);
    
        widthSlider.oninput = widthChange;
        heightSlider.oninput = heightChange;
        speedSlider.oninput = speedChange;

        for(button of buttonList) { 
            button.addEventListener('mousedown', toggle);
            button.addEventListener('click', toggle);
            button.addEventListener('click', updateButtons);
         }
    }
    function cleanupListeners() {
        playButton.removeEventListener('click', handlePlay);
        pauseButton.removeEventListener('click', grid.pause);
        restartButton.removeEventListener('click', handleRestart);
        toroidalButton.removeEventListener('click', grid.toggleToroidal);
        randomizeButton.removeEventListener('click', handleRandomize);
    
        widthSlider.removeEventListener('oninput', widthChange);
        heightSlider.removeEventListener('oninput', heightChange);
        speedSlider.removeEventListener('oninput', speedChange);

        for(button of buttonList) { 
            button.removeEventListener('mousedown', toggle);
            button.removeEventListener('click', toggle);
            button.removeEventListener('click', updateButtons);
         }
    }
 
    setupListeners();
    grid.drawInitialGrid();
}
function panels(gameGrid) {
    const doc = document;

    const shapeHolder           = doc.getElementById('shape_holder');
    const projectHider          = doc.getElementById('project_hider');
    const shapeHider            = doc.getElementById('sidebar_hider');
    const projectHolder         = doc.getElementById('project_holder');
    const shapeDisplayButton    = doc.getElementById('shape_display');
    const projectDisplayButton  = doc.getElementById('project_display');
    const addProjectButton      = doc.getElementById('add_project');

    const g = gameGrid;

    var list_of_shapes = {
        Standard: [
            [false,  false, false],
            [false,  true,  false],
            [false,  false, false],
        ],
        Block: [
            [false, false, false, false],
            [false, true,  true,  false],
            [false, true,  true,  false],
            [false, false, false, false],
        ],
        Beehive: [
            [false, false, false, false, false, false],
            [false, false, true,  true,  false, false],
            [false, true,  false, false, true,  false],
            [false, false, true,  true,  false, false],
            [false, false, false, false, false, false],
            [false, false, false, false, false, false],
        ],
        Loaf: [
            [false, false, false, false, false, false],
            [false, false, true,  true,  false, false],
            [false, true,  false, false, true,  false],
            [false, false, true,  false, true,  false],
            [false, false, false, true,  false, false],
            [false, false, false, false, false, false]
        ],
        Boat: [
            [false, false, false, false, false, false],
            [false, true,  true,  false, false, false],
            [false, true,  false, true,  false, false],
            [false, false, true,  false, false, false],
            [false, false, false, false, false, false],
            [false, false, false, false, false, false]
        ],
        Tub: [
            [false, false, false, false, false],
            [false, false, true,  false, false],
            [false, true,  false, true,  false],
            [false, false, true,  false, false],
            [false, false, false, false, false],
        ],
    
        Blinker: [
            [false, false, false, false, false],
            [false, false, false, false, false],
            [false, true,  true,  true,  false],
            [false, false, false, false, false],
            [false, false, false, false, false],
        ],
        Toad: [
            [false, false, false, false, false, false],
            [false, false, false, true,  false, false],
            [false, true,  false, false, true,  false],
            [false, true,  false, false, true,  false],
            [false, false, true,  false, false, false],
            [false, false, false, false, false, false]
        ],
        Beacon: [
            [false, false, false, false, false, false],
            [false, true,  true,  false, false, false],
            [false, true,  false, false, false, false],
            [false, false, false, false, true,  false],
            [false, false, false, true,  true,  false],
            [false, false, false, false, false, false]
        ]
    };
    
    function showShapesPanel() {
        this.classList.add('highlighted_display_button');
        projectDisplayButton.classList.remove('highlighted_display_button');
    
        shapeHider.classList.remove('hide');
        shapeHider.classList.add('show');
    
        projectHider.classList.remove('show');
        projectHider.classList.add('hide');
    }
    function showProjectPanel() {
        this.classList.add('highlighted_display_button');
        shapeDisplayButton.classList.remove('highlighted_display_button');
    
        projectHider.classList.remove('hide');
        projectHider.classList.add('show');
    
        shapeHider.classList.remove('show');
        shapeHider.classList.add('hide');
    }
    function addProject() {
        var projectToSave = cloneGrid(g.saveGridSnapshot());
        saved_projects.push(projectToSave);

        var projectPanelHolder = doc.createElement('div');
        var newProjectPanel = doc.createElement('div');
        var newProjectOverlay = doc.createElement('div');
        var loadButton = doc.createElement('button');
        var deleteButton = doc.createElement('button');
        
        projectPanelHolder.classList.add('relavtive');
        newProjectPanel.classList.add('project');
        newProjectOverlay.classList.add('projectOverlay');
        loadButton.classList.add('loadButton')
        deleteButton.classList.add('deleteButton')

        projectPanelHolder.appendChild(newProjectPanel);
        projectHolder.appendChild(projectPanelHolder);
        loadButton.appendChild(doc.createTextNode('Load Simulation'));
        deleteButton.appendChild(doc.createTextNode('Delete Simulation'));
        newProjectOverlay.appendChild(loadButton);
        newProjectOverlay.appendChild(deleteButton);
        projectPanelHolder.appendChild(newProjectOverlay);
        

        var projectDisplay = new DisplayGrid(newProjectPanel, projectToSave.length, projectToSave[0].length);
        projectDisplay.loadGrid(projectToSave);

        loadButton.addEventListener('click', loadProject.bind(null, projectToSave));
        deleteButton.addEventListener('click', deleteProject.bind(null, saved_projects, projectToSave, projectPanelHolder));
        newProjectOverlay.addEventListener('mouseover', handleOverlayHover);
        newProjectOverlay.addEventListener('mouseleave', handleOverlayMouseLeave);

        function loadProject(grid) { 
            let gridClone = cloneGrid(grid);
            g.loadGrid(gridClone);
        }
        function deleteProject(saved_projects, savedProject, projectPanelHolder) {
            var index = saved_projects.indexOf(savedProject);
            saved_projects.splice(index, 1);
            projectPanelHolder.parentNode.removeChild(projectPanelHolder);
        }
        function handleOverlayHover() {
            loadButton.style.opacity = 0.85;
            deleteButton.style.opacity = 0.85;
        }
        function handleOverlayMouseLeave() {
            loadButton.style.opacity = 0;
            deleteButton.style.opacity = 0;
        }
    }

    function setupShapelsPanel() {
        for(var l in list_of_shapes) {
            /**
             * Before anything, add a new 'shape' div 
             * to the 'shapeHolder' div in order to
             * allow the CSS for .shape to update the new
             * 'shape' div's dimensions
             */
            var shape = document.createElement('div');
            shape.classList.add('shape');
            shapeHolder.appendChild(shape);
            
            /**
             * We can now create a new Grid given that our shape is up to date
             */
            var shapeData = list_of_shapes[l];
            var shapeDisplay = new AnimatedGrid(shape);
            shapeDisplay.loadGrid(list_of_shapes[l]);
        
            if(l !== 'Standard') shapeDisplay.play();
            shape.onclick = function(shapeData) { 
                this.classList.add('borderedShape');
                g.customClickEnabled = true;
                g.customPattern = shapeData;
        
                for(var shapeDiv of shapeHolder.childNodes) {
                    if(this !== shapeDiv) {
                        shapeDiv.classList.remove('borderedShape');
                    }
                }
             }.bind(shape, shapeData);
        }
    }
    function setupListeners() {
        shapeDisplayButton.addEventListener('click', showShapesPanel);
        projectDisplayButton.addEventListener('click', showProjectPanel);
        addProjectButton.addEventListener('click', addProject);
    }
    function cleanupListeners() {
        shapeDisplayButton.removeEventListener('click', showShapesPanel);
        projectDisplayButton.removeEventListener('click', showProjectPanel);
        addProjectButton.removeEventListener('click', addProject);
    }
 
    setupListeners();
    setupShapelsPanel();
    projectHider.classList.add('hide');
}

var container = document.getElementById('container');
var g = new GameGrid(container);
setup(g);
panels(g);