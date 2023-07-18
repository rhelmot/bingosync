var RefereeDialog = (function(){
    "use strict";

    var RefereeDialog = function($refereePlayerList, initialPlayerList, kickPlayerUrl, makeRefereeUrl) {
        this.$refereePlayerList = $refereePlayerList[0];
        this.kickPlayerUrl = kickPlayerUrl;
        this.makeRefereeUrl = makeRefereeUrl;
        this.playerList = [] 

        for (let i in initialPlayerList){
            this.playedJoined(initialPlayerList[i]);
        }
        
        this.updatePlayerList();
    };

    RefereeDialog.prototype.playedLeft = function(player) {
        const index = this.playerList.indexOf(player);
        if (index > -1) {
            this.playerList.splice(index, 1); 
        }
    }

    RefereeDialog.prototype.playedJoined = function(player) {
        for (let i=0; i<this.playerList.length; i++){
            if (this.playerList[i].uuid == player.uuid){
                return;
            }
        }
        this.playerList.push(player);
        this.updatePlayerList();
    }

    RefereeDialog.prototype.createPlayerElement = function(player) {
        var div = document.createElement('div');
        div.style = "display: flex; align-items: center;";

        var name = document.createElement('p');
        name.innerText = player["name"] + ":";
        name.style = "width:100px; padding-right:5px; margin: 0; text-align:right;"

        var kickButton = document.createElement('button');
        kickButton.type = "button";
        kickButton.classList = "btn btn-primary";
        kickButton.style = "margin: 0; display: flex; align-items: center;"
        kickButton.onclick = () => this.kickPlayer(player["uuid"]);
        kickButton.innerText = "Kick Player";

        var makeRefereeButton = document.createElement('button');
        makeRefereeButton.type = "button";
        makeRefereeButton.classList = "btn btn-primary";
        makeRefereeButton.style = "margin: 0; display: flex; align-items: center;"
        makeRefereeButton.onclick = () => this.makeReferee(player["uuid"]);
        makeRefereeButton.innerText = "Make Referee";
        makeRefereeButton.disabled = player.is_referee;

        div.appendChild(name);
        div.appendChild(kickButton);
        div.appendChild(makeRefereeButton);

        return div;
    }

    RefereeDialog.prototype.updatePlayerList = function() {
        while (this.$refereePlayerList.firstChild) {
            this.$refereePlayerList.removeChild(this.$refereePlayerList.firstChild);
        }

        for (var player in this.playerList){
            this.$refereePlayerList.appendChild(this.createPlayerElement(this.playerList[player]));
        }
    };


    RefereeDialog.prototype.kickPlayer = function(player_uuid){
        console.log("kicking " + player_uuid);
        $.ajax({
            "url": this.kickPlayerUrl,
            "type": "PUT",
            "data": JSON.stringify({
                "room": window.sessionStorage.getItem("room"),
                "player_uuid":player_uuid,
            }),
            "error": function(result) {
                console.log(result);
            }
        });
    }

    RefereeDialog.prototype.makeReferee = function(player_uuid){
        console.log("reffing " + player_uuid);
        console.log(this.makeRefereeUrl);
        
        $.ajax({
            "url": this.makeRefereeUrl,
            "type": "PUT",
            "data": JSON.stringify({
                "room": window.sessionStorage.getItem("room"),
                "player_uuid":player_uuid,
            }),
            "error": function(result) {
                console.log(result);
            }
        });
        
    }

    return RefereeDialog;
})();