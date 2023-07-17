var RefereePanel = (function(){
    "use strict";

    var RefereePanel = function($refereePanel, kickPlayerUrl) {
        this.$refereePanel = $refereePanel;
        this.kickPlayerUrl = kickPlayerUrl;

        console.log(this.kickPlayerUrl)
        
        this.initPanel();
    };

    RefereePanel.prototype.initPanel = function() {
        this.$refereePanel.on("click", () => this.kickPlayer())

        this.$refereePanel.find("#referee-panel-collapse").on("mousedown", function() {
            $("#referee-panel .panel-body").toggle(50);
        });
    };


    RefereePanel.prototype.kickPlayer = function(){
        $.ajax({
            "url": this.kickPlayerUrl,
            "type": "PUT",
            "data": JSON.stringify({
                "room": window.sessionStorage.getItem("room")
            }),
            "error": function(result) {
                console.log(result);
            }
        });
    }

    return RefereePanel;
})();