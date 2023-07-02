var AdditionalSettingsPanel = (function(){
    "use strict";

    var AdditionalSettingsPanel = function($additionalSettings, $board) {
        this.$additionalSettings = $additionalSettings;
        this.$highlightsCheckbox =  $additionalSettings.find("#highlighter-toggle");

        this.$board = $board;

        this.initPanel();
    };

    AdditionalSettingsPanel.prototype.initPanel = function() {
        var additionalSettingsPanel = this;

        this.$highlightsCheckbox.on("change", function() {
            additionalSettingsPanel.toggleHighlights(this.checked);
        });

        this.$additionalSettings.find("#additional-settings-collapse").on("mousedown", function() {
            $("#additional-settings .panel-body").toggle(50);
        });

        this.$boardSetUp = false;
    };

    AdditionalSettingsPanel.prototype.COLORS = {
        "red": "#6F0000",
        "cyan": "#168A84",
        "orange": "#8D4F12",
        "pink": "#AE2691",
        "green": "#207E10",
        "grey": "#676767",
        "purple": "#521F92",
        "yellow": "#929006",
    }

    AdditionalSettingsPanel.prototype.HIGHLIGHTED_WORDS = {
        "Hearts": "yellow",
        "Berries": "red",
        "Blue Hearts": "cyan",
        "Blue Heart": "cyan",
        "Blue": "cyan",
        "Cassettes": "orange",
        "Cassette": "orange",
        "B-Sides": "pink",
        "B-Side": "pink",
        "Red Hearts": "pink",
        "Red Heart": "pink",
        "Collectibles": "green",
        "Binoculars": "grey",
        "Binocular": "grey",
        "A-Sides": "purple",
    }

    AdditionalSettingsPanel.prototype.highlightSquare = function(HIGHLIGHTED_WORDS, square){
        let textContainer = $(square).find(".text-container")[0];

        let tileHTML = textContainer.innerHTML;

        for (let word in HIGHLIGHTED_WORDS) {
            if (word != "Hearts") {
                tileHTML = tileHTML.replace(word, `<span class = "highlight-${HIGHLIGHTED_WORDS[word]}">${word}</span>`);
            }
            else {
                if (!tileHTML.includes("Red Hearts") && !tileHTML.includes("Blue Hearts")){
                    tileHTML = tileHTML.replace(word, `<span class = "highlight-${HIGHLIGHTED_WORDS[word]}">${word}</span>`);
                }
            }
        }

        textContainer.innerHTML = tileHTML;
    }

    AdditionalSettingsPanel.prototype.addHighlightsToBoard = function(){
        if (this.$boardSetUp) return;

        this.$boardSetUp = true;

        let $tiles = this.$board.find(".square");

        $tiles.each((_, tile) => this.highlightSquare(this.HIGHLIGHTED_WORDS, tile));

    };

    AdditionalSettingsPanel.prototype.newBoard = function(){
        this.$boardSetUp = false;

        if (this.$additionalSettings.find("#highlighter-toggle")[0].checked){
            this.addHighlightsToBoard();
            this.enableHighlights();
        }
    };

    AdditionalSettingsPanel.prototype.enableHighlights = function() {
        for (let color in this.COLORS) {
            $(`.highlight-${color}`).css('background', this.COLORS[color])
        }
    }

    AdditionalSettingsPanel.prototype.disableHighlights = function() {
        for (let color in this.COLORS) {
            $(`.highlight-${color}`).css('background', 'none')
        }
    }

    AdditionalSettingsPanel.prototype.toggleHighlights = function(checked) {
        if (checked){
            this.addHighlightsToBoard();
            this.enableHighlights();
        }
        else {
            this.disableHighlights();
        }
    };

    return AdditionalSettingsPanel;
})();
