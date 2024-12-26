const { v4: uuidv4 } = require('uuid');
class PlayerController {
    constructor() {
        this.players = [];
    }

    createPlayer(ws, nickname = null) {
        const playerID = uuidv4();
        const playerNR = this.getPlayerNextId();
        const player = { playerID: playerID, ws, nickName: "Player " + playerNR, roomID: null, playerNR: playerNR, isMasterPlayer: false };
        this.players.push(player);
        return player;
    }

    updateNickname(playerID, nickname) {
        const player = this.players.find(player => player.playerID === playerID);
        if (player) {
            player.nickName = nickname;
        }
        return player;
    }

    notifyAllPlayerSkipCurrent(room, currentPlayer, isMasterPlayerNr) {
        if (room.players) {

            for (let i = 0; i < room.players.length; i++) {
                if (currentPlayer.playerID != room.players[i].playerID) {
                    currentPlayer.ws.send(JSON.stringify({
                        type: 'join_room',
                        isMasterPlayerId: isMasterPlayerNr,
                        playerNR: room.players[i].playerNR,
                        playerID: room.players[i].playerID,
                        nickName: room.players[i].nickName,
                        message: "Player Joined!!!"
                    }));

                }
            }
        }
    }
    updateMasterPlayer(playerID) {
        const player = this.players.find(player => player.playerID === playerID);
        if (player) {
            player.isMasterPlayer = true;
        }
        return player;
    }

    removePlayer(playerID) {
        this.players = this.players.filter(player => player.playerID !== playerID);
        return true;
    }

    getPlayer(playerID) {
        return this.players.find(p => p.playerID === playerID);
    }
    getPlayerNextId() {
        return this.players.length > 0 ? (this.players[this.players.length - 1].playerNR) + 1 : 1;
    }
    getAllPlayer() {
        return this.players;
    }

    getPlayersInRoom(roomID) {
        return Object.values(this.players).filter(player => player.roomID === roomID);
    }
}

module.exports = new PlayerController();
