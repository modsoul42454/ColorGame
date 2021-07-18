window.onload = function () {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: '#000000',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: Math.round(window.innerWidth),
            height: Math.round(window.innerHeight)-200
        },
        physics: {
            default: "arcade",
            arcade: {
                debug: true
            }
        },
        dom: {
            createContainer: true
        },
        scene: [playGame, Hud]
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}
var sq_size = 20
var init_x = 20
var init_y = 20
spacer = 20
num_x = null
num_y = null
var reload_data = true

var array_rects
var array_rects_to_save
var array_groups
var distance_old = 0
var playGame_class_var
var array_ii = Array()
var array_jj = Array()
var array_count = Array()
var array_text_ii = [];
var array_text_jj = [];
var array_text = []
var isDragging = false
var rect_container
var total_time = 0
var last_pointer_down_time
var game_score 
var correct_num = 0;
var distance_orig = 0
var time_id_element = document.getElementById('time_id')
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}


function isPortrait() {
    return window.innerHeight > window.innerWidth;
}

function isLandscape() {
    return (window.orientation === 90 || window.orientation === -90);
}

const findDuplicates = (arr) => {
    let sorted_arr = arr.slice().sort(); // You can define the comparing function here. 
    // JS by default uses a crappy string compare.
    // (we use slice to clone the array so the
    // original array won't be modified)
    let results = [];
    for (let i = 0; i < sorted_arr.length - 1; i++) {
        if (sorted_arr[i + 1] == sorted_arr[i]) {
            results.push(sorted_arr[i]);
        }
    }
    return results;
}
function rgbToHex(r, g, b) {
    r = Math.round(r)
    g = Math.round(g)
    b = Math.round(b)
    return "0x" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while (i--) arr[length - 1 - i] = createArray.apply(this, args);
    }

    return arr;
}

function equals(x, y) {

    return (Math.abs(x - y) < 0.01)
}
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    var currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

class Hud extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });

        this.score = 0;
    }
    create() {
        //  Our Text object to display the Score
        let info = this.add.text(10, 10, 'Score: 0', { font: '36px Arial' });
        info.setFill('black')
        info.setBackgroundColor('White')
        //  Grab a reference to the Game Scene
        let ourGame = this.scene.get('PlayGame');

        //  Listen for events from it
        ourGame.events.on('addScore', function ({ str_score, direction }) {

            // this.score += 10;

            info.setText('Score: ' + str_score);

            if (direction > 0) {
                info.setFill('Red')
            } else {
                info.setFill('blue')
            }

        }, this);
    }

}

function interpolateLinearly(x, values) {

    // Split values into four lists
    var x_values = [];
    var r_values = [];
    var g_values = [];
    var b_values = [];
    for (i in values) {
        x_values.push(values[i][0]);
        r_values.push(values[i][1][0]);
        g_values.push(values[i][1][1]);
        b_values.push(values[i][1][2]);
    }

    var i = 1;
    while (x_values[i] < x) {
        i = i + 1;
    }
    i = i - 1;

    var width = Math.abs(x_values[i] - x_values[i + 1]);
    var scaling_factor = (x - x_values[i]) / width;

    // Get the new color values though interpolation
    var r = r_values[i] + scaling_factor * (r_values[i + 1] - r_values[i])
    var g = g_values[i] + scaling_factor * (g_values[i + 1] - g_values[i])
    var b = b_values[i] + scaling_factor * (b_values[i + 1] - b_values[i])

    return [enforceBounds(r), enforceBounds(g), enforceBounds(b)];

}
function enforceBounds(x) {
    if (x < 0) {
        return 0;
    } else if (x > 1) {
        return 1;
    } else {
        return x;
    }
}

const count_offset_color_map = Math.round(Math.random() * num_x * num_y)
function SetColorMapOfGrid(ColorMap_to_use, ii, jj, count) {

    count += count_offset_color_map * 0

    count = count % (num_x * num_y)
    if (ColorMap_to_use === 'Moose') {
        var r = ii / num_x * 200 + 55;
        var g = (ii + jj) / (sq_size * 2);
        var b = jj / num_y * 255;
    } else {
        var color = interpolateLinearly(count / num_x / num_y, ColorMap_to_use);
        var r = Math.round(255 * color[0]);
        var g = Math.round(255 * color[1]);
        var b = Math.round(255 * color[2]);
    }
    var hex_c = rgbToHex(r, g, b);
    return hex_c
}


class playGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }
    preload() {
        var url;

        url = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexpinchplugin.min.js';
        this.load.plugin('rexpinchplugin', url, true);
    }

    change_color() {
        var count = 0
        var color_list = document.getElementById("optList")
        if (color_list.value !== 'Moose') {
            var colormap_name = color_list.value
            var ColorMap_to_use = eval(colormap_name.replace('_y', '').replace('_x', ''))
        }
        else {
            var ColorMap_to_use = 'Moose'
            colormap_name = 'Moose'
        }

        if (colormap_name.includes('_y') || ColorMap_to_use == 'Moose') {
            for (var jj = 0; jj < num_y; jj++) {
                for (var ii = 0; ii < num_x; ii++) {

                    var hex_c = SetColorMapOfGrid(ColorMap_to_use, ii, jj, count);
                    var rect1 = array_rects[ii][jj];
                    rect1.fillColor = hex_c
                    count++
                }
            }
        }
        else if (colormap_name.includes('_x')) {
            for (var ii = 0; ii < num_x; ii++) {
                for (var jj = 0; jj < num_y; jj++) {

                    var hex_c = SetColorMapOfGrid(ColorMap_to_use, ii, jj, count);
                    var rect1 = array_rects[ii][jj];
                    rect1.fillColor = hex_c
                    count++
                }
            }


        }


        localStorage.setItem('colormap_val', JSON.stringify(color_list.selectedIndex));


    }

    offset_sliderChange() {
        var slider_offset = document.getElementById("myOffsetVal")

        game.scene.scenes[0].slider_offset_val = parseInt(slider_offset.value)

    }
    getConfirmation() {
        var retVal = confirm("Do you want to randomize the grid ?");
        playGame_class_var
        if (retVal == true) {

            playGame_class_var.RandomizeGrid()
            playGame_class_var.destroy_child_objects('Text')
            playGame_class_var.post_randomization_clean_up_cycles = 30
            return true;
        }
    }
    create() {

        time_id_element = document.getElementById('time_id')
        this.post_randomization_clean_up_cycles = 0
        playGame_class_var = this
        this.dragScale = this.plugins.get('rexpinchplugin').add(this);
        var camera = this.cameras.main;
        this.pinch_zoom_flag = false
        this.dragScale.dragThreshold = 1
        this.frameTime = 0
        isDragging = false
        this.dragScale
            .on('pinch', function (dragScale) {
                if (!this.dragObj === null) {
                    this.dragObj.x = this.dragObj.last_pos_x
                    this.dragObj.y = this.dragObj.last_pos_y
                    this.dragObj = null
                }
                var scaleFactor = dragScale.scaleFactor;
                camera.zoom *= scaleFactor;
                // //console.log(camera.scrollX)
                var drag1Vector = dragScale.drag1Vector;

                camera.scrollX -= drag1Vector.x / camera.zoom;

                camera.scrollY -= drag1Vector.y / camera.zoom;



            }, this)

        this.input.dragTimeThreshold = 0.
        this.input.addPointer(4)

        // 
        var slider_offset = document.getElementById("myOffsetVal")
        slider_offset.onchange = this.offset_sliderChange
        this.slider_offset_val = slider_offset.value


        var ResetButton = document.getElementById("ResetButton")
        ResetButton.onclick = this.getConfirmation
        // 

        var colormaps = ['Blues', 'BuGn', 'BuPu',
            'GnBu', 'Greens', 'Greys', 'Oranges', 'OrRd',
            'PuBu', 'PuBuGn', 'PuRd', 'Purples', 'RdPu',
            'Reds', 'YlGn', 'YlGnBu', 'YlOrBr', 'YlOrRd', 'afmhot', 'autumn', 'bone', 'cool', 'copper',
            'gist_heat', 'gray', 'hot', 'pink',
            'spring', 'summer', 'winter', 'BrBG', 'bwr', 'coolwarm', 'PiYG', 'PRGn', 'PuOr',
            'RdBu', 'RdGy', 'RdYlBu', 'RdYlGn', 'Spectral',
            'seismic', 'Accent', 'Dark2', 'Paired', 'Pastel1', 'Pastel2', 'Set1', 'Set2', 'Set3', 'gist_earth', 'terrain', 'ocean', 'gist_stern',
            'brg', 'CMRmap', 'cubehelix', 'gnuplot',
            'gnuplot2', 'gist_ncar', 'nipy_spectral',
            'jet', 'rainbow', 'gist_rainbow', 'hsv',
            'flag', 'prism']
        var color_list = document.getElementById("optList")
        color_list.onchange = this.change_color

        // var color_next = document.getElementById("optList")
        color_list.onchange = this.change_color


        for (var color_add in colormaps) {


            for (var direction in ['_x', '_y']) {
                var option = document.createElement("option")
                option.text = colormaps[color_add] + ['_x', '_y'][direction]
                option.value = colormaps[color_add] + ['_x', '_y'][direction]
                color_list.add(option, 1)
            }

        }

        // for (var color_add in colormaps) {
        //     var option = document.createElement("option")
        //     option.text = colormaps[color_add] + '_x'
        //     option.value = colormaps[color_add] + '_x'

        //     color_list.add(option, 1)
        // }

        var option = document.createElement("option")
        option.text = 'Moose'
        option.value = 'Moose'

        color_list.add(option, 1)

        this.ColorMap_to_use = 'Moose'
        if (this.ColorMap_to_use != 'Moose') {
            this.ColorMap_to_use = eval(colormaps[1])
        }


        var Num_x_input = document.getElementById("num_x_id")
        var Num_y_input = document.getElementById("num_y_id")
        var test_num_x = JSON.parse(localStorage.getItem('num_x'));
        if (test_num_x != null) {
            Num_x_input.value = JSON.parse(localStorage.getItem('num_x'));
            Num_y_input.value = JSON.parse(localStorage.getItem('num_y'));
        }
        
        this.GenerateInitialGrid();

        this.input.on('pointerdown', this.PointerDown, this)
        // this.input.on('pointer2down', this.pointer2_down, this)
        this.ReloadData();
        this.change_color();
        // var count;
        // var ii;
        // var jj;
        // var array_text_jj;
        // var array_text_ii;
        // var text;
        // ({ count, ii, jj, array_text_jj, array_text_ii, text, ii, jj } = this.newMethod(count, array_text_ii, array_text_jj, ii, jj, text));

        var Spread_button = document.getElementById("Spread_button")
        Spread_button.onclick = this.spreadtiles
    }

    spreadtiles() {
        this.max_x = init_x + (num_x) * spacer
        this.max_y = init_y + (num_y) * spacer
        for (var ii = 0; ii < num_x; ii++) {
            for (var jj = 0; jj < num_y; jj++) {
                if (array_rects[ii][jj].flag_interactive) {
                    array_rects[ii][jj].x = 2 * (Math.random() - 0.5) * this.max_x / 2
                    array_rects[ii][jj].y = 2 * (Math.random() - 0.5) * this.max_y / 2
                }
            }
        }

    }

    ReloadData() {
        var recover_array = JSON.parse(localStorage.getItem('Array'));
        if (recover_array == null) {
            reload_data = false;
        }


        var arrays_xy = []
        var count = 0
        try {
            if (reload_data) {

                var Num_x_input = document.getElementById("num_x_id")
                var Num_y_input = document.getElementById("num_y_id")
                Num_x_input.value = JSON.parse(localStorage.getItem('num_x'));
                Num_y_input.value = JSON.parse(localStorage.getItem('num_y'));

                var recover_array = JSON.parse(localStorage.getItem('Array'));
                var recover_colormap = JSON.parse(localStorage.getItem('colormap_val'));
                total_time = JSON.parse(localStorage.getItem('total_time'));

                for (var ii = 0; ii < num_x; ii++) {
                    for (var jj = 0; jj < num_y; jj++) {
                        array_rects[ii][jj].x = recover_array[ii][jj].x;
                        array_rects[ii][jj].y = recover_array[ii][jj].y;
                        array_rects[ii][jj].last_pos_x = array_rects[ii][jj].x;
                        array_rects[ii][jj].last_pos_y = array_rects[ii][jj].y;
                        array_rects[ii][jj].setInteractive({ draggable: true });
                        array_rects[ii][jj].flag_interactive = true;
                        arrays_xy[count] = [array_rects[ii][jj].x, recover_array[ii][jj].y]
                        count++

                    }
                }
                var color_list = document.getElementById("optList")


                // var duplicates = findDuplicates(arrays_xy)
                color_list.selectedIndex = recover_colormap
                color_list.onchange()

                recover_array = array_rects
                for (var ii = 0; ii < num_x; ii++) {
                    for (var jj = 0; jj < num_y; jj++) {
                        var rect_in = recover_array[ii][jj]
                        rect_in.x = Math.round(rect_in.x / spacer) * spacer
                        rect_in.y = Math.round(rect_in.y / spacer) * spacer


                        for (var ii1 = 0; ii1 < num_x; ii1++) {
                            for (var jj1 = 0; jj1 < num_y; jj1++) {



                                var cond1 = recover_array[ii][jj].x == recover_array[ii1][jj1].x && recover_array[ii][jj].y == recover_array[ii1][jj1].y &&
                                    recover_array[ii][jj] != recover_array[ii1][jj1] //&& recover_array[ii][jj].orig_pos_x != recover_array[ii1][jj1].orig_pos_x && 
                                recover_array[ii][jj].orig_pos_y != recover_array[ii1][jj1].orig_pos_y

                                if (cond1) {
                                    //console.log(recover_array[ii][jj])
                                    //console.log(recover_array[ii1][jj1])
                                    recover_array[ii][jj].x = -50 //init_x + (num_x + 5) * spacer
                                    recover_array[ii][jj].y = -50

                                    recover_array[ii][jj].last_pos_x = recover_array[ii][jj].x;
                                    recover_array[ii][jj].last_pos_y = recover_array[ii][jj].y;
                                }
                            }
                        }
                    }
                }
                // this.SaveGame()

            }
        }
        catch
        {

        }
        this.SaveGame()

    }

    destroy_child_objects(type_of_object) {
        for (var ii = 0; ii < 10; ii++) {
            for (var child_obj_indx in this.children.list) {
                var child_obj = this.children.list[child_obj_indx]
                if (child_obj.type == type_of_object) {
                    child_obj.destroy()
                }
            }

        }
    }

    GenerateInitialGrid() {
        var Num_x_input = document.getElementById("num_x_id")
        var Num_y_input = document.getElementById("num_y_id")
        num_x = parseInt(Num_x_input.value)
        num_y = parseInt(Num_y_input.value)
        localStorage.setItem('num_x', JSON.stringify(num_x));
        localStorage.setItem('num_y', JSON.stringify(num_y));
        rect_container = this.add.container(0, 0)
        // spacer = Math.floor(Math.min(Math.round(window.innerWidth)/num_x, Math.round(window.innerHeight)/num_y))
        // sq_size = spacer
        // init_x = spacer
        // init_y = spacer
        this.destroy_child_objects('Text')
        this.destroy_child_objects('Rectangle')
        var ColorMap_to_use = this.ColorMap_to_use
        var count = 0
        array_rects = createArray(num_x, num_y)
        array_rects_to_save = createArray(num_x, num_y)
        

        this.max_x = init_x + (num_x) * spacer
        this.max_y = init_y + (num_y) * spacer
        for (var ii = 0; ii < num_x; ii++) {
            for (var jj = 0; jj < num_y; jj++) {

                var hex_c = SetColorMapOfGrid(ColorMap_to_use, ii, jj, count);
                // // //console.log(hex)
                // var r1 = this.add.rectangle(init_x + ii*sq_size, init_y + jj*sq_size, sq_size, sq_size, 0x6666ff );
                var rect1 = this.add.rectangle(init_x + ii * (spacer), init_y + jj * spacer, sq_size, sq_size, hex_c);
                rect1.depth = 10
                rect_container.add(rect1)
                rect1.fillColor = hex_c;
                // var group = this.add.container()
                // group.add(rect1)
                // array_groups[ii][jj] = group
                rect1.last_pos_x = rect1.x;
                rect1.last_pos_y = rect1.y;
                array_rects[ii][jj] = rect1;

                array_rects[ii][jj].orig_pos_x = array_rects[ii][jj].x;
                array_rects[ii][jj].orig_pos_y = array_rects[ii][jj].y;
                array_rects[ii][jj].flag_interactive = true
                array_rects[ii][jj].setInteractive({ draggable: true });

                array_rects_to_save[ii][jj] = new Object()
                array_rects_to_save[ii][jj].x = array_rects[ii][jj].x
                array_rects_to_save[ii][jj].y = array_rects[ii][jj].y

                array_rects_to_save[ii][jj].orig_pos_x = array_rects[ii][jj].orig_pos_x
                array_rects_to_save[ii][jj].orig_pos_y = array_rects[ii][jj].orig_pos_y


                array_ii.push(ii);
                array_jj.push(jj);
                array_count.push(count);
                count++;

            }
        }
        return { ii, jj, count };
    }

    RandomizeGrid() {
        rect_container.removeAll()
        this.destroy_child_objects('Text')
        this.destroy_child_objects('Rectangle')
        this.GenerateInitialGrid()
        var count = 0;
        this.array_text = [];


        var difficulty_val = document.getElementById("difficulty_val")
        var difficulty_ratio = Math.log10(parseInt(difficulty_val.value))

        for (var ii = 0; ii < num_x; ii++)
            for (var jj = 0; jj < num_y; jj++) {
                {
                    array_rects[ii][jj].flag_interactive = true;
                    array_rects[ii][jj].setInteractive({ draggable: true });
                }
            }

        //console.log({ difficulty_ratio })
        for (var ii = 0; ii < num_x; ii++)
            for (var jj = 0; jj < num_y; jj++) {
                {
                    array_rects[ii][jj].flag_interactive = true;
                    array_rects[ii][jj].setInteractive({ draggable: true });
                    //  |
                    if (Math.random() > difficulty_ratio) {

                        array_rects[ii][jj].x = init_x + Math.random() * (num_x - 1) * (spacer);
                        array_rects[ii][jj].y = init_y + Math.random() * (num_y - 1) * (spacer);
                        this.find_and_swap(array_rects[ii][jj], false);
                        array_rects[ii][jj].last_pos_x = array_rects[ii][jj].x;
                        array_rects[ii][jj].last_pos_y = array_rects[ii][jj].y;
                        array_rects[ii][jj].visible = true

                        array_rects_to_save[ii][jj] = new Object()
                        array_rects_to_save[ii][jj].x = array_rects[ii][jj].x
                        array_rects_to_save[ii][jj].y = array_rects[ii][jj].y

                        array_rects_to_save[ii][jj].orig_pos_x = array_rects[ii][jj].orig_pos_x
                        array_rects_to_save[ii][jj].orig_pos_y = array_rects[ii][jj].orig_pos_y

                    }
                    else {

                    }
                }
            }
        // //console.log(count)
        this.destroy_child_objects('Text')
        var color_list = document.getElementById("optList")

        color_list.onchange()

    }

    pointer2_down() {
        // //console.log('Pointer 2 down')
    }
    PointerDown(pointer, targets) {
        last_pointer_down_time = Date.now()
        
        // //console.log('isPinched' + this.dragScale.isPinched)
        if (this.input.pointer1.active && !this.input.pointer2.active && !this.dragScale.isPinched) {
            if (targets[0] != null) {


                // this.input.on('pointerdown', this.PointerDown, this)
                this.dragObj = targets[0]

                this.rect1 = this.dragObj
                this.rect1.on('dragstart', (pointer, dragX, dragY) => {
                    this.slider_offset_flag = false
                    isDragging = true
                   

                })
                this.rect1.on('drag', (pointer, dragX, dragY) => {
                    if (!this.dragScale.isPinched) {
                        // //console.log('Draggin')
                        this.rect1.x = dragX
                        var yoffset = 0
                        if (isDragging == false){
                            distance_orig = Math.sqrt((this.rect1.x - this.rect1.orig_pos_x) ** 2 + (this.rect1.y - this.rect1.orig_pos_y) ** 2);
                            //console.log({distance_orig})
                        }
                        isDragging = true
                        this.rect1.y = dragY - this.slider_offset_val //- correction_y


                        var bound_rect = this.cameras.main.worldView
                        var cond1 = (bound_rect.right - dragX) < 10 || (dragX - bound_rect.left) < 10


                        cond1 = cond1 && (dragX < init_x + (num_x - 2) * spacer) && (dragX > init_x)
                        if (cond1) {
                            this.camera_scroll_x = 1 / this.cameras.main.zoom
                        }

                        this.rect1.depth = 1000

                        var ddistance = distance_orig - (Math.sqrt((this.rect1.x - this.rect1.orig_pos_x) ** 2 + (this.rect1.y - this.rect1.orig_pos_y) ** 2))
                        ddistance = ddistance / spacer
                        
                        //console.log({ddistance,distance_orig})

                        var str_score = correct_num + '/' + num_x * num_y + ', ' + (game_score + ddistance).toFixed(2);
                        this.events.emit('addScore', { str_score, ddistance });

                        rect_container.bringToTop(this.rect1)


                    }
                });
                this.rect1.on('dragend', (pointer, dragX, dragY) => {
                    // //console.log('end draggin')
                    this.rect1.depth = 10
                    this.find_and_swap(this.rect1, true)
                    this.rect1.slider_offset_flag = false
                    isDragging = false
                })




            }
        }

    }


    find_and_swap(rect_in, game_fully_initialized = false) {


        var new_x = Math.round(rect_in.x / spacer) * spacer
        var new_y = Math.round(rect_in.y / spacer) * spacer
        var sub_found = false



        for (var ii = 0; ii < num_x; ii++)
            for (var jj = 0; jj < num_y; jj++) {
                {

                    array_rects_to_save[ii][jj].x = array_rects[ii][jj].x
                    array_rects_to_save[ii][jj].y = array_rects[ii][jj].y

                    array_rects_to_save[ii][jj].orig_pos_x = array_rects[ii][jj].orig_pos_x
                    array_rects_to_save[ii][jj].orig_pos_y = array_rects[ii][jj].orig_pos_y

                    if (array_rects[ii][jj] != rect_in & equals(array_rects[ii][jj].x, new_x) & equals(array_rects[ii][jj].y, new_y)) {
                        var intersected_array = array_rects[ii][jj]
                        sub_found = true

                    }
                }
            }


        if (sub_found && intersected_array.flag_interactive) {
            intersected_array.x = rect_in.last_pos_x
            intersected_array.y = rect_in.last_pos_y

            intersected_array.last_pos_x = intersected_array.x
            intersected_array.last_pos_y = intersected_array.y

            rect_in.x = Math.round(rect_in.x / spacer) * spacer
            rect_in.y = Math.round(rect_in.y / spacer) * spacer

            rect_in.last_pos_x = rect_in.x
            rect_in.last_pos_y = rect_in.y

        }
        else if (!sub_found) {
            rect_in.x = Math.round(rect_in.x / spacer) * spacer
            rect_in.y = Math.round(rect_in.y / spacer) * spacer

            rect_in.last_pos_x = rect_in.x
            rect_in.last_pos_y = rect_in.y
        }

        else {


            if (rect_in.x > init_x + num_x * spacer || rect_in.y > init_y + num_y * spacer) {
                rect_in.x = Math.round(rect_in.x / spacer) * spacer
                rect_in.y = Math.round(rect_in.y / spacer) * spacer

                rect_in.last_pos_x = rect_in.x
                rect_in.last_pos_y = rect_in.y
            }
            else {
                rect_in.x = rect_in.last_pos_x
                rect_in.y = rect_in.last_pos_y

                rect_in.last_pos_x = rect_in.x
                rect_in.last_pos_y = rect_in.y
            }


        }
        if (game_fully_initialized) {
            this.SaveGame();


        }
    }

    SaveGame() {
        this.compute_score_and_save();
        for (var ii = 0; ii < num_x; ii++) {
            for (var jj = 0; jj < num_y; jj++) {

                array_rects_to_save[ii][jj].x = array_rects[ii][jj].x
                array_rects_to_save[ii][jj].y = array_rects[ii][jj].y

                array_rects_to_save[ii][jj].orig_pos_x = array_rects[ii][jj].orig_pos_x
                array_rects_to_save[ii][jj].orig_pos_y = array_rects[ii][jj].orig_pos_y
            }
        }
        var string_data = JSON.stringify(array_rects_to_save);
        localStorage.setItem('Array', string_data);
        var color_list = document.getElementById("optList");
        localStorage.setItem('colormap_val', JSON.stringify(color_list.selectedIndex));
        localStorage.setItem('total_time',JSON.stringify(total_time));
        var Num_x_input = document.getElementById("num_x_id")
        var Num_y_input = document.getElementById("num_y_id")
        num_x = parseInt(Num_x_input.value)
        num_y = parseInt(Num_y_input.value)
        localStorage.setItem('num_x', JSON.stringify(num_x));
        localStorage.setItem('num_y', JSON.stringify(num_y));

        
    }

    compute_score_and_save() {
        var total_distance = 0.0;
        correct_num = 0
        var distance
        for (var ii = 0; ii < num_x; ii++)
            for (var jj = 0; jj < num_y; jj++) {
                {
                    distance = Math.sqrt((array_rects[ii][jj].x - array_rects[ii][jj].orig_pos_x) ** 2 + (array_rects[ii][jj].y - array_rects[ii][jj].orig_pos_y) ** 2);
                    distance = distance / spacer
                    total_distance += distance;
                    if (Math.abs(distance) < 0.01) {
                        correct_num++;
                    }


                    if (distance == 0 && array_rects[ii][jj].flag_interactive && isDragging == false) {
                        var text = this.add.text(array_rects[ii][jj].x - spacer / 4, array_rects[ii][jj].y - spacer / 4, 'o', { color: rgbToHex(0, 0, 0) })
                        rect_container.add(text)
                        rect_container.depth = 1
                        text.depth = 1000
                        array_rects[ii][jj].disableInteractive();
                        array_rects[ii][jj].flag_interactive = false
                    }


                }
            }

        var str_score = correct_num + '/' + num_x * num_y + ', ' + total_distance.toFixed(2);
        var direction = -distance_old + total_distance
        distance_old = total_distance
        game_score = total_distance
        this.events.emit('addScore', { str_score, direction });
        // array_rects )


    }

    update(time, delta) {
        this.frameTime += delta
        if ( (Date.now() - last_pointer_down_time)/1000<10  ){
            
            total_time +=delta
           
        }
       
        if (this.frameTime > 1000) {
            // this.compute_score_and_save()
            this.frameTime = 0
            time_id_element.innerText = (total_time/1000).toFixed(2) + ' s'

        }



    }


}

