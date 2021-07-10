window.onload = function () {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: 0x87ceeb,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: 650,
            height: 650*2
        },
        physics: {
            default: "arcade",
            arcade: {
                debug: true
            }
        },
        scene: playGame
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}
var sq_size = 20
var init_x = 20
var init_y = 20
spacer = 20
num_x = 30
num_y = 60
var reload_data = true
var array_rects
var array_groups

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
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


class playGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }
    preload() {
        var url;

        url = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexpinchplugin.min.js';
        this.load.plugin('rexpinchplugin', url, true);
    }

    create() {
        this.dragScale = this.plugins.get('rexpinchplugin').add(this);
        var camera = this.cameras.main;
        this.pinch_zoom_flag = false
        this.dragScale.dragThreshold = 1
        this.dragScale
            .on('pinch', function (dragScale) {
                if (!this.dragObj === null) {
                    this.dragObj.x = this.dragObj.last_pos_x
                    this.dragObj.y = this.dragObj.last_pos_y
                    this.dragObj = null
                }
                var scaleFactor = dragScale.scaleFactor;
                camera.zoom *= scaleFactor;
                // console.log(camera.scrollX)
                var drag1Vector = dragScale.drag1Vector;
                camera.scrollX -= drag1Vector.x / camera.zoom;
                camera.scrollY -= drag1Vector.y / camera.zoom;
            }, this)
        array_rects = createArray(num_x, num_y)
        array_groups = createArray(num_x, num_y)
        var array_ii = Array()
        var array_jj = Array()
        var array_count = Array()
        this.score_text = this.add.text(10, num_y * spacer + init_y, 'test', { color: rgbToHex(0, 0, 0) })
        var count = 0

        this.input.dragTimeThreshold = 0.
        this.input.addPointer(4)
        for (var ii = 0; ii < num_x; ii++) {
            for (var jj = 0; jj < num_y; jj++) {

                var r = ii / num_x * 200 + 55
                var g = (ii + jj) / (sq_size * 2)
                var b = jj / num_y * 255
                var hex_c = rgbToHex(r, g, b)
                // // console.log(hex)
                // var r1 = this.add.rectangle(init_x + ii*sq_size, init_y + jj*sq_size, sq_size, sq_size, 0x6666ff );
                var rect1 = this.add.rectangle(init_x + ii * (spacer), init_y + jj * spacer, sq_size, sq_size, hex_c);
                // var group = this.add.container()
                // group.add(rect1)
                // array_groups[ii][jj] = group

                rect1.last_pos_x = rect1.x
                rect1.last_pos_y = rect1.y
                array_rects[ii][jj] = rect1

                array_rects[ii][jj].orig_pos_x = array_rects[ii][jj].x
                array_rects[ii][jj].orig_pos_y = array_rects[ii][jj].y


                // array_rects[ii][jj].visible = false
                // array_rects[ii][jj].disableInteractive()

                array_rects[ii][jj].setInteractive({ draggable: true })
                // array_rects[ii][jj].add.text('dsd')
                array_ii.push(ii)
                array_jj.push(jj)
                array_count.push(count)
                count++

            }
        }

        this.input.on('pointerdown', this.PointerDown, this)
        // this.input.on('pointer2down', this.pointer2_down, this)
        reload_data = true
        if (reload_data ) {
            var recover_array = JSON.parse(localStorage.getItem('Array'))
            var recover_text_marking_array = JSON.parse(localStorage.getItem('text_array'))
            var array_text_jj = JSON.parse(localStorage.getItem('array_text_jj'))
            var array_text_ii = JSON.parse(localStorage.getItem('array_text_ii'))
            for (var ii = 0; ii < num_x; ii++) {
                for (var jj = 0; jj < num_y; jj++) {
                    array_rects[ii][jj].x = recover_array[ii][jj].x
                    array_rects[ii][jj].y = recover_array[ii][jj].y
                    array_rects[ii][jj].last_pos_x = array_rects[ii][jj].x
                    array_rects[ii][jj].last_pos_y = array_rects[ii][jj].y
                    array_rects[ii][jj].setInteractive()
                    array_rects[ii][jj].flag_interactive = true



                }
            }

            for (var itx = 0; itx < recover_text_marking_array.length; itx++) {
                var text_mark = recover_text_marking_array[itx]
                var text = this.add.text(text_mark.x, text_mark.y, 'o', { color: rgbToHex(0, 0, 0) })
                text.depth = text_mark.depth
                array_rects[array_text_ii[itx]][array_text_jj[itx]].disableInteractive()
                array_rects[array_text_ii[itx]][array_text_jj[itx]].flag_interactive = false
                // array_rects[array_text_ii[itx]][array_text_jj[itx]].visible = true
            }

        }

        if (!reload_data) {
            var count = 0
            this.array_text = []
            var array_text_ii = []
            var array_text_jj = []
            for (var ii = 0; ii < num_x; ii++)
                for (var jj = 0; jj < num_y; jj++) {
                    {
                        array_rects[ii][jj].flag_interactive = true
                        //  |
                        if (Math.random() < .9) {
                            var graphics = this.add.graphics()
                            array_rects[ii][jj].x = init_x + Math.random() * num_x * (spacer)
                            array_rects[ii][jj].y = init_y + Math.random() * num_y * (spacer)
                            this.find_and_swap(array_rects[ii][jj]);
                            array_rects[ii][jj].last_pos_x = array_rects[ii][jj].x
                            array_rects[ii][jj].last_pos_y = array_rects[ii][jj].y
                            // array_rects[ii][jj].visible = false
                            array_rects[ii][jj].flag_interactive = true
                            array_rects[ii][jj].setInteractive();
                            // array_rects[ii][jj].color = rgbToHex(0,0,0)
                            // this.add.text(array_rects[ii][jj].x , array_rects[ii][jj].y  ,
                            //      'o', { color: rgbToHex(0,0,0) }).setOrigin(0, 0);

                        }
                        else {

                            var text = this.add.text(array_rects[ii][jj].x - spacer / 4, array_rects[ii][jj].y - spacer / 4, 'o', { color: rgbToHex(0, 0, 0) })
                            text.depth = 1000
                            array_text_ii.push(ii)
                            array_text_jj.push(jj)
                            array_rects[ii][jj].disableInteractive();
                            array_rects[ii][jj].flag_interactive = false
                            this.array_text.push(text)
                        }
                    }
                }
            // console.log(count)
            var string_data = JSON.stringify(this.array_text)
            localStorage.setItem('text_array', string_data)
            localStorage.setItem('array_text_ii', JSON.stringify(array_text_ii))
            localStorage.setItem('array_text_jj', JSON.stringify(array_text_jj))
        }


    }


    pointer2_down() {
        // console.log('Pointer 2 down')
    }
    PointerDown(pointer, targets) {

        // console.log('isPinched' + this.dragScale.isPinched)
        if (this.input.pointer1.active && !this.input.pointer2.active && !this.dragScale.isPinched) {
            if (targets[0] != null) {


                // this.input.on('pointerdown', this.PointerDown, this)
                this.dragObj = targets[0]

                this.rect1 = this.dragObj
                this.rect1.on('drag', (pointer, dragX, dragY) => {
                    if (!this.dragScale.isPinched) {
                        // console.log('Draggin')
                        this.rect1.x = dragX
                        this.rect1.y = dragY
                        // var drag1Vector = dragScale.drag1Vector;
                        // camera.scrollX -= drag1Vector.x / camera.zoom;
                        // camera.scrollY -= drag1Vector.y / camera.zoom;
                        this.rect1.depth = 100
                    }
                });
                this.rect1.on('dragend', (pointer, dragX, dragY) => {
                    // console.log('end draggin')
                    this.rect1.depth = 1
                    this.find_and_swap(this.rect1)
                })

                // this.rect1.on('pointerdown', (pointer, localx, localy) => {

                //     this.dragObj = targets[0]


                //     if (this.selected == null) {
                //         this.selected = this.rect1
                //         this.selected.alpha = 0.3
                //         console.log('rect selected = ' + this.selected)
                        
                //     }
                //     else if (this.selected === this.dragObj)
                //     {

                //     }
                //     else
                //     {
                //         this.selected.x = this.dragObj.x
                //         this.selected.y = this.dragObj.y
                //         this.find_and_swap(this.selected)
                        
                //         this.selected.alpha = 1
                //         this.selected = null
                //     }
                // })




            }
        }

    }


    find_and_swap(rect_in) {


        var new_x = Math.round(rect_in.x / spacer) * spacer
        var new_y = Math.round(rect_in.y / spacer) * spacer
        var sub_found = false

        for (var ii = 0; ii < num_x; ii++)
            for (var jj = 0; jj < num_y; jj++) {
                {
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

            // // console.log(intersected_array)
            // // console.log(rect_in)

        }
        else {
            rect_in.x = rect_in.last_pos_x
            rect_in.y = rect_in.last_pos_y

            rect_in.last_pos_x = rect_in.x
            rect_in.last_pos_y = rect_in.y

        }

        var correct_num = 0
        for (var ii = 0; ii < num_x; ii++)
            for (var jj = 0; jj < num_y; jj++) {
                {
                    // var intersection_data = Phaser.Geom.Intersects.GetRectangleIntersection(rect_in, array_rects[ii][jj]);  
                    // var intersection = Phaser.Geom.Intersects.RectangleToRectangle(array_rects[ii][jj], rect_in);    

                    if (array_rects[ii][jj].x == array_rects[ii][jj].orig_pos_x && array_rects[ii][jj].y == array_rects[ii][jj].orig_pos_y) {
                        correct_num++
                    }
                    if (array_rects[ii][jj] != rect_in & equals(array_rects[ii][jj].x, new_x) & equals(array_rects[ii][jj].y, new_y)) {
                        var intersected_array = array_rects[ii][jj]
                        sub_found = true
                    }
                }
            }

        this.score_text.text = correct_num + '/' + num_y * num_y
        // array_rects )
        var string_data = JSON.stringify(array_rects)
        localStorage.setItem('Array', string_data)

        // recover_array = JSON.parse(string_data)
    }

    update() {

    }


}


