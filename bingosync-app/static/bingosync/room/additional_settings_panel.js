var AdditionalSettingsPanel = (function(){
    "use strict";

    var AdditionalSettingsPanel = function($additionalSettings, $board) {
        this.$additionalSettings = $additionalSettings;
        this.$highlightsCheckbox = $additionalSettings.find("#highlighter-toggle");
        this.$blackoutCheckbox = $additionalSettings.find("#blackoutview-toggle");

        this.$board = $board;

        this.initPanel();
    };

    AdditionalSettingsPanel.prototype.initPanel = function() {
        var additionalSettingsPanel = this;

        this.$highlightsCheckbox.on("change", function() {
            additionalSettingsPanel.toggleHighlights(this.checked);
        });

        this.$blackoutCheckbox.on("change", function() {
            additionalSettingsPanel.toggleBlackoutView(this.checked);
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

    /* Blackout View by Rhuan */

    function log(...data) {
		const B_LOGGING = false;
		if (!B_LOGGING) { return; }

		const date = new Date();

		const time = "[" +
			String(date.getHours()).padStart(2, "0") + ":" +
			String(date.getMinutes()).padStart(2, "0") + ":" +
			String(date.getSeconds()).padStart(2, "0") + "." +
			String(date.getMilliseconds()).padStart(3, "0") + "]";

		console.log(time, ...data);
	}

	/* Core Functionalities */

	const BAV =
	{
		b_enabled: false,
		color: "this should get replaced by enableBAV()",
		board_observer: null,
		square_observers: []
	};

	function createDimContainers() {
		const $squares = document.querySelectorAll("td.square");

		for (let i = 0; i < $squares.length; i++) {
			const $square = $squares[i];
			if ($square.querySelector("div.dim_container")) { continue; }

			const $dim_container = document.createElement("div");
			$dim_container.classList.add("dim_container");

			/* should be in CSS */
			$dim_container.style.display = "flex";
			$dim_container.style.flexDirection = "row-reverse";
			$dim_container.style.position = "absolute";
			$dim_container.style.width = "100%";
			$dim_container.style.height = (100 / 9) + "%";
			$dim_container.style.left = 0;
			$dim_container.style.bottom = 0;
			$dim_container.style.zIndex = 1;

			$square.insertAdjacentElement("afterbegin", $dim_container);
		}

		log("Created all Dim Containers");
	}

	function removeDimContainers() {
		const $dim_containers = document.querySelectorAll("div.dim_container");

		for (let i = 0; i < $dim_containers.length; i++) {
			$dim_containers[i].remove();
		}

		log("Removed all Dim Containers");
	}

	function resetSquare($square) {
		const $bg_colors = $square.querySelectorAll("div.bg-color:not(div.dim)");
		for (let i = 0; i < $bg_colors.length; i++) {
			const $bg_color = $bg_colors[i];

			$bg_color.style.display = "";

			if (!$bg_color.dataset.oldStyle) { continue; }

			const old_style = JSON.parse($bg_color.dataset.oldStyle);
			Object.assign($bg_color.style, old_style);
		}

		const $dim_container = $square.querySelector("div.dim_container");
		if ($dim_container !== null) {
			const $dims = $dim_container.querySelectorAll("div.dim");
			for (let i = 0; i < $dims.length; i++) {
				$dims[i].remove();
			}
		}

		log("Square", $square.id, "has been Reset");
	}

	function resetAllSquares() {
		const $squares = document.querySelectorAll("td.square");

		for (let i = 0; i < $squares.length; i++) {
			resetSquare($squares[i]);
		}
	}

	function highlightSquare($square, color) {
		const $dim_container = $square.querySelector("div.dim_container");

		if ($dim_container === null) {
			log("Square", $square.id, "has no Dim Container");

			/* if it has no Dim Container, something went wrong; reset BAV */
			disableBAV();
			enableBAV();
		}

		resetSquare($square);

		const full_color = color + "square";
		const $bg_colors = $square.querySelectorAll("div.bg-color");

		for (let i = 0; i < $bg_colors.length; i++) {
			const $bg_color = $bg_colors[i];
			if ($bg_color.classList.contains(full_color)) {
				$bg_color.style.transform = "none";
			}
			else {
				const bg_color_styles = getComputedStyle($bg_color);
				$bg_color.style.display = "none";

				const $dim = document.createElement("div");
				$dim.classList.add("bg-color", "dim");

				/* should be in CSS */
				$dim.style.position = "static";
				$dim.style.width = (100 / 9) + "%";
				$dim.style.height = "100%";
				$dim.style.flexShrink = 1;
				$dim.style.backgroundImage = bg_color_styles.backgroundImage;

				$dim_container.append($dim);
			}
		}

		log("Square", $square.id, "has been highlighted with the color", color);
	}

	function highlightAllSquares(color) {
		const $squares = document.querySelectorAll("td.square");
		for (let i = 0; i < $squares.length; i++) {
			highlightSquare($squares[i], color);
		}
	}

	/* Callbacks & Events */

	function squareObserverCallback(mutations) {
		const mutation = mutations[0];

		if (mutation.attributeName !== "title") { return; }

		const $bg_colors = mutation.target.querySelectorAll("div.bg-color:not(div.dim)");
		for (let i = 0; i < $bg_colors.length; i++) {
			const $bg_color = $bg_colors[i];
			const old_style = {};

			const style_properties = Object.values($bg_color.style);

			for (let j = 0; j < style_properties.length; j++) {
				const property = style_properties[j];
				old_style[property] = $bg_color.style[property];
			}

			$bg_color.dataset.oldStyle = JSON.stringify(old_style);
		}

		highlightSquare(mutation.target, BAV.color);
	}

	function boardObserverCallback(mutations) {
		disableBAV();
		enableBAV();
	}

	function colorChooserOnClick() {
		BAV.color = document.querySelector("div.chosen-color").getAttribute("squarecolor");
		highlightAllSquares(BAV.color);
	}

	function bodyOnResize() {
		highlightAllSquares(BAV.color);
	}

	function bavToggleOnChange() {
		BAV.b_enabled = this.checked;

		if (BAV.b_enabled) { enableBAV(); }
		else { disableBAV(); }
	}

	/* Enabling & Disabling Black Alt. View */

	function disableBAV() {
		resetAllSquares();
		removeDimContainers();

		const $bg_colors = document.querySelectorAll("td div.bg-color");
		for (let i = 0; i < $bg_colors.length; i++) {
			delete $bg_colors[i].dataset.oldStyle;
		}

		BAV.board_observer.disconnect();

		const $squares = document.querySelectorAll("td.square");
		for (let i = 0; i < $squares.length; i++) {
			BAV.square_observers[i].disconnect();
			$squares[i].querySelector("div.text-container").style.zIndex = "";
		}

		const $color_buttons = document.querySelectorAll("div.color-chooser");
		for (let i = 0; i < $color_buttons.length; i++) {
			$color_buttons[i].removeEventListener("click", colorChooserOnClick);
		}

		BAV.b_enabled = false;
		log("Black Alt. View has been disabled");
	}

	function enableBAV() {
		BAV.b_enabled = true;

		createDimContainers();

		const $bg_colors = document.querySelectorAll("td div.bg-color");
		for (let i = 0; i < $bg_colors.length; i++) {
			const $bg_color = $bg_colors[i];
			const old_style = {};

			const style_properties = Object.values($bg_color.style);

			for (let j = 0; j < style_properties.length; j++) {
				const property = style_properties[j];
				old_style[property] = $bg_color.style[property];
			}

			$bg_color.dataset.oldStyle = JSON.stringify(old_style);
		}

		const $board = document.querySelector("table#bingo");
		BAV.board_observer = new MutationObserver(boardObserverCallback);
		BAV.board_observer.observe($board, { childList: true });

		const $squares = document.querySelectorAll("td.square");
		for (let i = 0; i < $squares.length; i++) {
			const $square = $squares[i];

			BAV.square_observers[i] = new MutationObserver(squareObserverCallback);
			BAV.square_observers[i].observe($square, { attributes: true });

			$square.querySelector("div.text-container").style.zIndex = 2;
		}

		const $color_buttons = document.querySelectorAll("div.color-chooser");
		for (let i = 0; i < $color_buttons.length; i++) {
			$color_buttons[i].addEventListener("click", colorChooserOnClick);
		}

		/*
		BingoSync has started a war against our forces.
		We must NOT give up on our window resizing privileges!
		ATTACK WITH FULL POWER!!!
		*/
		document.body.onresize = bodyOnResize;

		colorChooserOnClick();
		highlightAllSquares(BAV.color);

		log("Black Alt. View has been enabled");
	}

    AdditionalSettingsPanel.prototype.toggleBlackoutView = function(checked) {
        if (checked){
            enableBAV();
        }
        else {
            disableBAV();
        }
    };

    return AdditionalSettingsPanel;
})();
