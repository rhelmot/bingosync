var RoomSettingsPanel = (function(){
    "use strict";

    var RoomSettingsPanel = function($roomSettingsContainer, roomSettingsUrl, boardHiddenUrl, board) {
        this.$roomSettingsContainer = $roomSettingsContainer;
        this.roomSettingsUrl = roomSettingsUrl;
        this.boardHiddenUrl = boardHiddenUrl;
        this.board = board;

        this.initPanel();
    };

    RoomSettingsPanel.prototype.initPanel = function() {
        this.$panelBody = this.$roomSettingsContainer.find(".panel-body");
        this.$collapseButton = this.$roomSettingsContainer.find(".collapse-button");
        this.$hideButton = this.$roomSettingsContainer.find(".hide-button");

        var that = this;
        this.$collapseButton.on("mousedown", function() {
            that.$panelBody.toggle(50);
        });

        this.$hideButton.on("mousedown", function() {
            hideBoard();
            $.ajax({
                "url": that.boardHiddenUrl,
                "type": "PUT",
                "data": JSON.stringify({
                    "room": window.sessionStorage.getItem("room"),
                }),
                "error": function(result) {
                    console.log(result);
                }
            });
        })
    };

    RoomSettingsPanel.prototype.reloadSettingsRequest = function() {
        var that = this;
        return $.ajax({
            "url": this.roomSettingsUrl,
            "success": function(result) {
                that.$roomSettingsContainer.html(result.panel);
                that.initPanel();

                // TODO: encapsulate room settings in settings panel
                ROOM_SETTINGS = result.settings;

                // TODO: extract seed reveal to a chat panel class
                var $seedInChat = $("#bingo-chat .new-card-message .seed-wait").removeClass('seed-wait');
                if (ROOM_SETTINGS.hide_card) {
                    hideBoard();
                    $seedInChat.text("Hidden").addClass('seed-hidden');
                } else {
                    revealBoard();
                    $seedInChat.text(ROOM_SETTINGS.seed).addClass('seed');
                }

                // TODO: extract new card logic
                refreshNewCardDialog();
            },
            "error": function(result) {
                console.log(result);
            }
        }).always(function(){
            that.board.fogOfWar = ROOM_SETTINGS.fog_of_war;

            that.board.hideSquares(ROOM_SETTINGS.fog_of_war);
        });
    }

    RoomSettingsPanel.prototype.reloadSettings = function() {
        this.reloadSettingsRequest();
    };

    RoomSettingsPanel.prototype.setBoardHidden = function(hideBoard) {
        this.$hideButton.disabled = !hideBoard;
    }

    return RoomSettingsPanel;
})();
