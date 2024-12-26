const { broadcast } = require("../utils/broadcast");
const playerController = require('../controllers/playerController');

class RoomController {

    constructor() {
        this.rooms = [];
    }

    createRoom(roomID, options) {
        this.rooms.push({
            players: [],
            roomID: roomID,
            isPuplic: options.isPuplic || true,
            isOpen: options.isOpen || true,
            roomCreateUser: options.playerID,
            maxPlayers: options.maxPlayers || 4,
        })
    }

    addPlayerToRoom(roomID, player) {
        try {
            const room = this.rooms.find(room => room.roomID === roomID);
            var isExits = false;
            for (let i = 0; i < room.players.length; i++) {
                if (player.playerID == room.players[i].playerID) {
                    isExits = true;
                    break;
                }
            }
            if (!isExits) {
                room.players.push(player)
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.log(error);
        }


    }
    getRoomByPlayerID(playerID) {
        for (let j = 0; j < this.rooms.length; j++) {
            for (let i = 0; i < this.rooms[j].players.length; i++) {
                if (playerID == this.rooms[j].players[i].playerID) {
                    return this.rooms[j].roomID;
                }
            }
        }
        return null;
    }
    getAllPlayerInRoom(roomID) {
        var roomsData = this.rooms.filter(r => r.roomID == roomID);
        if (roomsData.length > 0) {
            return roomsData[0].players;
        } else {
            return [];
        }
    }

    deleteRoom(roomID) {
        this.rooms = this.rooms.filter(r => r.roomID !== roomID);
        console.log(`Room ${roomID} has been deleted.`);
    }

    removePlayerFromRoom(roomID, playerData) {
        const room = this.rooms.find(room1 => room1.roomID === roomID);
        if (room) {
            room.players = room.players.filter(player => player.playerID !== playerData.playerID);
        }
    }
    getMasterPlayerID(roomID) {
        const room = this.rooms.find(room1 => room1.roomID === roomID);
        if (room) {
            const player = room.players.filter(player => player.isMasterPlayer === true);
            if (player)
                return player[0].playerNR;
            else
                return "";
        }
    }

    getRoom(roomID) {
        return this.rooms.find(room1 => room1.roomID === roomID);
    }

    getAllRooms() {
        return this.rooms;
    }

    findRandomRoom() {
        const availableRooms = Object.keys(this.rooms).filter(roomID => {
            const room = this.rooms[roomID];
            return room.players.length < room.maxPlayers && room.isOpen && room.isPuplic;
        });
        if (availableRooms.length > 0) {
            return this.rooms[Math.floor(Math.random() * availableRooms.length)].roomID;
        }
        return null; // No rooms available
    }
}

module.exports = new RoomController();
