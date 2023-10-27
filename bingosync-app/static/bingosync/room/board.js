var Board = (function(){
    "use strict";

    var ORDERED_COLORS = ["pink", "red", "orange", "yellow", "green", "teal", "forest", "blue", "navy", "purple"];

    function sortColors(colors) {
        var orderedColors = [];
        for (var i = 0; i < ORDERED_COLORS.length; i++) {
            if (colors.indexOf(ORDERED_COLORS[i]) !== -1) {
                orderedColors.push(ORDERED_COLORS[i]);
            }
        }
        return orderedColors;
    }

    function getSquareColors($square) {
        var colors = {};
        $square.children('.bg-color').each(function() {
            for (var color in $(this).getClasses()) {
                if (color.indexOf("square") !== -1) {
                    colors[color] = true;
                }
            }
        });
        return colors;
    }

    function squareHasColor($square, colorClass) {
        var colors = getSquareColors($square);
        return colors[colorClass];
    }

    function updateColorOffsets($square) {
        var $colorElements = $square.children('.bg-color');
        var numColors = $colorElements.length;
        var translatePercent = {
            2: ['0', '0'],
            3: ['0', '36', '-34'],
            4: ['0', '46', '0', '-48'],
            5: ['0', '56', '18', '-18', '-56'],
            6: ['0', '60', '30', '0', '-30', '-60'],
            7: ['0', '64', '38', '13', '-13', '-38', '-64'],
            8: ['0', '64', '41', '20', '0', '-21', '-41', '-64'],
            9: ['0', '66', '45', '27', '9', '-9', '-27', '-45', '-66'],
            10: ['0', '68', '51', '34', '17', '0', '-17', '-34', '-51', '-68']
        };
        var translations = translatePercent[numColors];

        var curWidth = $colorElements.width();
        var curHeight = $colorElements.height();
        var targetAngle = Math.atan(curWidth/curHeight);

        $($colorElements[0]).css('transform', '');
        for (var i = 1; i < $colorElements.length; ++i) {
            var transform = 'skew(-' + targetAngle + 'rad) translateX(' + translations[i] + '%)';
            $($colorElements[i]).css('transform', transform);
            $($colorElements[i]).css('border-right', 'solid 1.5px #444444');
        }
    }

    function setSquareColors($square, colors) {
        $square.children('.bg-color').remove();
        colors = colors.split(' ');
        var shadow = $square.children('.shadow');
        colors = sortColors(colors);
        $square.attr("title", colors.join("\n"));
        // the color offsets seem to work right-to-left, so reverse the array first
        colors.reverse();
        colors.forEach(function (color) {
            shadow.before('<div class="bg-color ' + getSquareColorClass(color) + '"></div>');
        });
        updateColorOffsets($square);
    }

    var Square = function($square) {
        this.$square = $square;
        this.hidden = $square.hidden;
        this.$square.on("click", this.onClick);
    };

    Square.prototype.setColors = function(colors) {
        this.$square.children('.bg-color').remove();
        colors = colors.split(' ');
        var shadow = this.$square.children('.shadow');
        colors = sortColors(colors);
        this.$square.attr("title", colors.join("\n"));
        // the color offsets seem to work right-to-left, so reverse the array first
        colors.reverse();
        colors.forEach(function (color) {
            shadow.before('<div class="bg-color ' + getSquareColorClass(color) + '"></div>');
        });
        updateColorOffsets(this.$square);
    };

    Square.prototype.onClick = function(ev) {
    };

    Square.prototype.setJson = function(json) {
        this.$square.html('<div class="starred hidden"></div><div class="shadow"></div>' +
                          '<div class="vertical-center text-container"></div>');
        this.$square.children(".text-container").text(json["name"]);
        this.tier = json["tier"]
        setSquareColors(this.$square, json["colors"]);
    };

    var Board = function($board, playerJson, colorChooser, getBoardUrl, selectGoalUrl, fogOfWar) {
        this.$board = $board;
        this.size = 0;
        this.isSpectator = playerJson.is_spectator;
        this.colorChooser = colorChooser;
        this.getBoardUrl = getBoardUrl;
        this.selectGoalUrl = selectGoalUrl;
        this.fogOfWar = fogOfWar;
        this.squares = [];
        this.$squares = null;
    };

    Board.prototype.setup = function(size) {
        this.size = size;
        this.$board.html('');
        const top = $('<tr>').appendTo(this.$board);
        top.append('<td class="unselectable popout" id="tlbr">TL-BR</td>');
        for (let iCol = 0; iCol < size; iCol++) {
            $('<td class="unselectable popout"></td>')
                .attr('id', 'col' + (iCol + 1).toString())
                .text('COL' + (iCol + 1).toString())
                .appendTo(top);
        }
        let slot = 1;
        for (let iRow = 0; iRow < size; iRow++) {
            const row = $('<tr>').appendTo(this.$board);
            $('<td class="unselectable popout"></td>')
                .attr('id', 'row' + (iRow + 1).toString())
                .text('ROW' + (iRow + 1).toString())
                .appendTo(row);
            for (let iCol = 0; iCol < size; iCol++) {
                const td = $('<td class="unselectable square blanksquare tlbr"></td>')
                    .addClass('row' + (iRow + 1).toString())
                    .addClass('col' + (iCol + 1).toString())
                    .attr('id', 'slot' + slot);
                if (iRow === iCol) {
                    td.addClass('tlbr');
                }
                if (iRow === size - 1 - iCol) {
                    td.addClass('bltr');
                }
                td.appendTo(row);
                slot++;
            }
        }
        this.$board.append('<tr><td class="unselectable popout" id="bltr"></td></tr>');

        this.$squares = this.$board.find(".square");
        this.squares = [];
        for (let i = 0; i < size * size; i++) {
            var $square = this.$board.find("#slot" + (i + 1));
            // if fog of war is enabled, hide all squares by default
            if (this.fogOfWar) { 
                $square.hidden = true
            }
            this.squares.push(new Square($square));
        }

        this.hideSquares()

        var that = this;
        if (!this.isSpectator) {
            this.$squares.on("click", function(ev) { that.clickSquare(ev, $(this)); });
        }

        function addRowHover(name) {
            that.$board.find("#" + name).hover(
                function() {
                    that.$board.find("." + name).addClass("hover");
                },
                function() {
                    that.$board.find("." + name).removeClass("hover");
                }
            );
        }

        for (let i = 0; i < this.size; i++) {
            addRowHover('row' + (i + 1).toString());
            addRowHover('col' + (i + 1).toString());
        }
        addRowHover('tlbr');
        addRowHover('bltr');

        $(window).resize(function () {
            that.$squares.each(function () { updateColorOffsets($(this)); });
        });

        // add starring ability via right click
        this.$squares.on("contextmenu", function(e) {
            e.preventDefault();
            $(this).children(".starred").toggleClass("hidden");
            return false;
        });
    };

    Board.prototype.checkTile = function(i, chosenColorClass) {
        var x = $.isEmptyObject(getSquareColors(this.squares[i].$square))
        if (!x) {
            var x = squareHasColor(this.squares[i].$square, chosenColorClass)
            if (x) {
                return true;
            }
        }
        return false;
    };

    Board.prototype.hideSquares = function(override=null) {
        // hack to get new boards to work properly
        if (override !== null) {
            this.fogOfWar = override;
        }

        const hideIfHidden = function(el) {
            if (el.tier === 0) {
                el.$square.removeClass("hiddentext");
                return;
            }

            if (el.hidden) {
                el.$square.addClass("hiddentext"); 
            } else {
                el.$square.removeClass("hiddentext"); 
            }
        }

        if (!this.fogOfWar) {
            for (let i = 0; i < this.size * this.size; i++) {
                this.squares[i].hidden = false
            }
            this.squares.forEach((el) => hideIfHidden(el));
            return;
        }

        var chosenColor = this.colorChooser.getChosenColor();
        var chosenColorClass = getSquareColorClass(chosenColor);

        for (let i = 0; i < this.size * this.size; i++) {
            this.squares[i].hidden = true

            if (this.checkTile(i, chosenColorClass)) {
                this.squares[i].hidden = false
            }
            

            if (i % this.size !== 0) {
                if (this.checkTile(i - 1, chosenColorClass)) {
                    this.squares[i].hidden = false
                }
            }

            if (i % this.size !== this.size - 1) {
                if (this.checkTile(i + 1, chosenColorClass)) {
                    this.squares[i].hidden = false
                }
            }

            if (i >= this.size) {
                if (this.checkTile(i - this.size, chosenColorClass)) {
                    this.squares[i].hidden = false
                }
            }

            if (i <= (this.size * (this.size - 1) - 1)) {
                if (this.checkTile(i + this.size, chosenColorClass)) {
                    this.squares[i].hidden = false
                }
            }
        }

        
        this.squares.forEach((el) => hideIfHidden(el));
    };

    Board.prototype.setJson = function(json) {
        this.setup(preciseSqrt(json.length));

        for (let i = 0; i < json.length; i++) {
            this.squares[i].setJson(json[i]);
        }
        this.refitGoalText();
    };

    Board.prototype.reloadBoardRequest = function(callback) {
        var that = this;
        return $.ajax({
            "url": this.getBoardUrl,
            "success": function(result) {
                that.setJson(result);
                if (callback !== undefined) {
                    callback();
                }
            }
        });
    }

    Board.prototype.reloadBoard = function(callback) {
        this.reloadBoardRequest(callback).then(response => this.hideSquares());
    };

    Board.prototype.getSquare = function(slot) {
        return this.squares[parseInt(slot.substring(4))-1];
    };

    Board.prototype.getColorCount = function(colorClass) {
        return this.$board.find("." + colorClass).size();
    };

    Board.prototype.getRowCount = function(colorClass) {
        var that = this;

        const filterFunc = function(row_name) {
            var rowSquares = that.$board.find("." + row_name);
            var coloredSquares = rowSquares.filter(function() {
                return squareHasColor($(this), colorClass);
            });
            return coloredSquares.size() === rowSquares.size() ? 1 : 0;
        };

        let count = 0;
        for (let i = 0; i < this.size; i++) {
            count += filterFunc('row' + (i + 1).toString());
            count += filterFunc('col' + (i + 1).toString());
        }
        count += filterFunc('tlbr');
        count += filterFunc('bltr');
        return count;
    };

    Board.prototype.colorSquare = function(ev, $square) {
        var chosenColor = this.colorChooser.getChosenColor();
        var chosenColorClass = getSquareColorClass(chosenColor);

        // Are we adding or removing the color
        var removeColor;
        // the square is blank and we're painting it
        if ($.isEmptyObject(getSquareColors($square))) {
            removeColor = false;
        }
        // the square is colored the same as the chosen color so we're clearing it (or just removing the chosen color from the square's colors)
        else if (squareHasColor($square, chosenColorClass)) {
            removeColor = true;
        }
        // the square is a different color, but we allow multiple colors, so add it
        else if (ROOM_SETTINGS.lockout_mode !== "Lockout") {
            removeColor = false;
        }
        // the square is colored a different color and we don't allow multiple colors, so don't do anything
        else {
            return;
        }
        
        return $.ajax({
            "url": this.selectGoalUrl,
            "type": "PUT",
            "data": JSON.stringify({
                "room": window.sessionStorage.getItem("room"),
                // substring to get rid of the 'slot' in e.g. 'slot12'
                "slot": $square.attr("id").substring(4),
                "color": chosenColor,
                // if we are removing the color, we need to know which color we are removing
                "remove_color": removeColor
            }),
            "error": function(result) {
                console.log(result);
            }
        });
    }

    Board.prototype.clickSquare = function(ev, $square) {
        this.colorSquare(ev, $square).then(response => this.hideSquares())
    };

    Board.prototype.refitGoalText = function() {
        var $allText = $('.square div.text-container');
        var maxHeight = $('.square').height();

        $allText.each(function () {
            var $thisText = $(this);
            $thisText.css('font-size', '100%');
            var currentPercent = 100;
            while($thisText.height() > maxHeight) {
                currentPercent -= 2;
                $thisText.css('font-size', currentPercent + "%" );
            }
        });
    };

    return Board;
})();
