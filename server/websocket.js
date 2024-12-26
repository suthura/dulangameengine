const WebSocket = require('ws');
const playerController = require('../controllers/playerController');
const roomController = require('../controllers/roomController');
const { broadcast, broadcastToMasterPlayer, broadcastToAllPlayer, broadcastToAllSkipCurrentPlayer } = require('../utils/broadcast');

const wss = new WebSocket.Server({ port: 8080 });
console.log("WebSocket server is running on ws://localhost:8080");

wss.on('connection', (ws) => {
    console.log("Player connected");
    const currentPlayer = playerController.createPlayer(ws);
    ws.send(JSON.stringify({
        type: 'connected', message: "Player connected!",
        playerNR: currentPlayer.playerNR,
        nickName: currentPlayer.nickName,
        playerID: currentPlayer.playerID
    }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'all_player':
                var players = [];
                if (data.roomID) {
                    players = roomController.getAllPlayerInRoom(data.roomID)
                } else {
                    players = playerController.getAllPlayer();
                }
                ws.send(JSON.stringify({ message: "All Players!", NoOfPlayer: players.length, players: players }));
                break;
            case 'create_player':
                const player = playerController.createPlayer(ws, data.nickName);
                const playerID = player.playerID;
                ws.send(JSON.stringify({
                    type: 'create_player',
                    message: "New Player Success!",
                    nickName: data.nickName,
                    playerNR: player.playerNR,
                    playerID: playerID
                }));
                break;
            case 'set_nickname':
                playerController.updateNickname(currentPlayer.playerID, data.nickname);
                ws.send(JSON.stringify({
                    message: "Player Name Set Success!",
                    type: "nickname_updated",
                    nickName: data.nickname,
                    playerNR: currentPlayer.playerNR,
                    playerID: currentPlayer.playerID
                }));
                break;

            case 'create_room':
                const roomID = require('../utils/uuidGenerator').generateUUID();
                if (currentPlayer) {
                    if (currentPlayer.nickName == null) {
                        ws.send(JSON.stringify({
                            type: 'create_room',
                            playerNR: currentPlayer.playerNR,
                            playerID: currentPlayer.playerID,
                            message: "Player nick name required  during  Create Room!!!"
                        }));
                    } else {
                        roomController.createRoom(roomID, {
                            isPuplic: data.isPuplic,
                            isOpen: data.isOpen,
                            maxPlayers: data.maxPlayers,
                            playerNR: currentPlayer.playerNR,
                            playerID: currentPlayer.playerID,
                        });
                        roomController.addPlayerToRoom(roomID, currentPlayer);
                        currentPlayer.isMasterPlayer = true;
                        console.log("Room Created!!!. Room ID :", roomID, " | Player ID : ", currentPlayer.playerID);
                        ws.send(JSON.stringify({
                            type: 'create_room', roomID,
                            isPuplic: data.isPuplic,
                            isOpen: data.isOpen,
                            maxPlayers: data.maxPlayers,
                            playerNR: currentPlayer.playerNR,
                            playerID: currentPlayer.playerID,
                            message: "Room Created!!!"
                        }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'create_room', message: "Player Not Found!" }));
                }
                break;
            case 'all_room':
                var rooms = roomController.getAllRooms();
                ws.send(JSON.stringify({ type: 'all_room', rooms, rooms }));
                break;
            case 'join_random_room':
                const randomRoomID = roomController.findRandomRoom(); // Find a random room
                if (randomRoomID) {
                    const room = roomController.getRoom(randomRoomID);
                    const isMasterPlayerNr = roomController.getMasterPlayerID(randomRoomID);
                    if (room && room.players.length < room.maxPlayers) {
                        roomController.addPlayerToRoom(randomRoomID, currentPlayer);
                        ws.send(JSON.stringify({
                            type: 'join_room',
                            isMasterPlayerId: isMasterPlayerNr,
                            playerNR: currentPlayer.playerNR,
                            playerID: currentPlayer.playerID,
                            nickName: currentPlayer.nickName,
                            roomID: randomRoomID,
                        }));
                        broadcast(room, {
                            type: 'join_room',
                            isMasterPlayerId: isMasterPlayerNr,
                            playerNR: currentPlayer.playerNR,
                            playerID: currentPlayer.playerID,
                            nickName: currentPlayer.nickName,
                        }, ws);
                        playerController.notifyAllPlayerSkipCurrent(room, currentPlayer, isMasterPlayerNr)
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'join_random_room_failed', message: 'No available rooms.' }));
                }
                break;
            case 'close_room':
                const roomDataGet = roomController.getRoom(data.roomID);
                if (roomDataGet) {
                    roomDataGet.isOpen = data.isOpen;
                }
                ws.send(JSON.stringify({
                    type: 'close_room',
                    playerNR: currentPlayer.playerNR,
                    roomID: data.roomID,
                    playerID: currentPlayer.playerID
                }));
                break;
            case 'join_room':
                const room = roomController.getRoom(data.roomID);
                const isMasterPlayerNr = roomController.getMasterPlayerID(data.roomID);

                if (room && room.players.length < room.maxPlayers) {
                    if (room.isOpen) {
                        if (currentPlayer.nickName == null) {
                            ws.send(JSON.stringify({
                                type: 'join_room',
                                isMasterPlayerId: isMasterPlayerNr,
                                playerNR: currentPlayer.playerNR,
                                nickName: currentPlayer.nickName,
                                playerID: currentPlayer.playerID,
                                message: "Player nick name required  during  Join Room!!!"
                            }));
                        } else {
                            if (currentPlayer && ws.readyState === WebSocket.OPEN) {
                                var isExits = roomController.addPlayerToRoom(data.roomID, currentPlayer);
                                if (isExits) {
                                    ws.send(JSON.stringify({
                                        type: 'join_room',
                                        isMasterPlayerId: isMasterPlayerNr,
                                        roomID: data.roomID,
                                        playerNR: currentPlayer.playerNR,
                                        nickName: currentPlayer.nickName,
                                        playerID: currentPlayer.playerID,
                                        message: "You are Joing the Room!!"
                                    }));
                                    broadcast(room, {
                                        type: 'join_room',
                                        isMasterPlayerId: isMasterPlayerNr,
                                        playerNR: currentPlayer.playerNR,
                                        nickName: currentPlayer.nickName,
                                        playerID: currentPlayer.playerID,
                                        message: "Player Joing Room"
                                    }, ws);
                                } else {
                                    ws.send(JSON.stringify({
                                        type: 'join_room',
                                        isMasterPlayerId: isMasterPlayerNr,
                                        roomID: data.roomID,
                                        playerNR: currentPlayer.playerNR,
                                        nickName: currentPlayer.nickName,
                                        playerID: currentPlayer.playerID,
                                        message: "Your already in Room!!"
                                    }));
                                }
                            } else {
                                ws.send(JSON.stringify({ type: 'join_room_failed', message: 'Invalid WebSocket or player data.' }));
                            }
                        }
                    } else {
                        ws.send(JSON.stringify({
                            type: 'join_room',
                            isMasterPlayerId: isMasterPlayerNr,
                            playerNR: currentPlayer.playerNR,
                            nickName: currentPlayer.nickName,
                            playerID: currentPlayer.playerID,
                            message: 'Room is closed now!!!'
                        }));
                    }
                } else {
                    ws.send(JSON.stringify({
                        type: 'join_room_failed',
                        playerNR: currentPlayer.playerNR,
                        playerID: currentPlayer.playerID,
                        nickName: currentPlayer.nickName,
                        message: 'Room full or does not exist.'
                    }));
                }
                playerController.notifyAllPlayerSkipCurrent(room, currentPlayer, isMasterPlayerNr)
                break;

            case 'leave_room':
                const roomData = roomController.getRoom(data.roomID);
                if (roomData) {
                    var playerData = playerController.getPlayer(currentPlayer.playerID)
                    roomController.removePlayerFromRoom(roomData.roomID, playerData);

                    if (playerData.isMasterPlayer) {
                        if (roomData.players.length > 0) {
                            playerController.updateMasterPlayer(roomData.players[0].playerID);
                            broadcastToAllSkipCurrentPlayer(roomData, {
                                type: 'master_player_updated',
                                masterplayerID: roomData.players[0].playerNR,
                                playerNR: roomData.players[0].playerNR,
                                playerID: roomData.players[0].playerID,
                                nickName: roomData.players[0].nickName,
                                message: "Master player updated"
                            }, currentPlayer.playerID);
                        }
                    }
                    if (roomData) {
                        ws.send(JSON.stringify({ type: 'leave_room', message: "Player left in room", playerNR: currentPlayer.playerNR, playerID: currentPlayer.playerID }));
                        broadcast(roomData, {
                            type: 'leave_room',
                            nickName: currentPlayer.nickName,
                            playerNR: currentPlayer.playerNR,
                            playerID: currentPlayer.playerID,
                            message: "Player left in room"
                        }, ws);
                        if (room.players.length === 0) {
                            roomController.deleteRoom(data.roomID);
                            console.log(`Room ${data.roomID} deleted because it's empty.`);
                        }
                    }

                }
                break;
            case 'find_master_player':
                try {
                    var roomData2 = roomController.getRoom(data.roomID);
                    for (let i = 0; i < roomData2.players.length; i++) {
                        if (roomData2.players[i].isMasterPlayer) {
                            ws.send(JSON.stringify({
                                type: 'find_master_player',
                                message: "This is a master player in room!!!",
                                playerNR: roomData2.players[i].playerNR,
                                playerID: roomData2.players[i].playerID,
                                nickName: roomData2.players[i].nickName
                            }));
                            break;
                        }
                    }
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'find_master_player',
                        message: "Failed due to : " + error,
                        playerNR: currentPlayer.playerNR,
                        playerID: currentPlayer.playerID,
                        nickName: currentPlayer.nickName
                    }));
                }
                break;
            case 'player_left':
                // Ensure the player is in a room 
                const roomData1 = roomController.getRoom(data.roomID);
                if (roomData1) {
                    var playerData = playerController.getPlayer(currentPlayer.playerID)
                    roomController.removePlayerFromRoom(data.roomID, playerData)
                    const room = roomController.getRoom(data.roomID);

                    if (playerData.isMasterPlayer) {
                        if (room.players.length > 0) {
                            playerController.updateMasterPlayer(room.players[0].playerID);
                            broadcastToAllSkipCurrentPlayer(room, {
                                type: 'master_player_updated',
                                masterplayerID: room.players[0].playerNR,
                                playerNR: room.players[0].playerNR,
                                playerID: room.players[0].playerID,
                                nickName: room.players[0].nickName,
                                message: "Master player updated"
                            }, currentPlayer.playerID);
                        }
                    }

                    playerController.removePlayer(currentPlayer.playerID)

                    if (room) {
                        broadcast(room, {
                            type: 'player_left',
                            nickName: currentPlayer.nickName,
                            playerNR: currentPlayer.playerNR,
                            playerID: currentPlayer.playerID
                        });
                        if (room.players.length === 0) {
                            roomController.deleteRoom(data.roomID);
                            console.log(`Room ${data.roomID} deleted because it's empty.`);
                        }
                    }
                    ws.send(JSON.stringify({
                        type: 'player_left',
                        playerNR: currentPlayer.playerNR,
                        nickName: currentPlayer.nickName,
                        playerID: currentPlayer.playerID,
                        message: `Player ${data.playerID} left room ${data.roomID}`
                    }));

                }
                break;
            case 'action_event':
                const roomDataObj = roomController.getRoom(data.roomID);
                if (roomDataObj) {
                    if (data.receiver === "master_player") {
                        broadcastToMasterPlayer(roomDataObj, {
                            type: 'action_event',
                            data: data.data,
                            code: data.code,
                            nickName: currentPlayer.nickName,
                            playerNR: currentPlayer.playerNR,
                            playerID: currentPlayer.playerID,
                            message: "Action event"
                        }, currentPlayer);
                    } else if (data.receiver === "all") {
                        broadcastToAllPlayer(roomDataObj, {
                            type: 'action_event',
                            data: data.data,
                            code: data.code,
                            nickName: currentPlayer.nickName,
                            playerNR: currentPlayer.playerNR,
                            playerID: currentPlayer.playerID,
                            message: "Action event"
                        }, currentPlayer);
                    } else {
                        broadcastToAllSkipCurrentPlayer(roomDataObj, {
                            type: 'action_event',
                            data: data.data,
                            code: data.code,
                            playerNR: currentPlayer.playerNR,
                            playerID: currentPlayer.playerID,
                            message: "Action event"
                        }, currentPlayer.playerID);
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'action_event', message: 'No room found!!!.' }));
                }
                break;
            default:
                ws.send(JSON.stringify({ type: 'error', message: 'Unknown action.' }));
        }
    });
    ws.on('open', () => console.log('WebSocket connection opened.'));
    ws.on('close', (code, reason) => {
        var roomID = roomController.getRoomByPlayerID(currentPlayer.playerID);

        var playerData = playerController.getPlayer(currentPlayer.playerID)
        roomController.removePlayerFromRoom(roomID, playerData)
        const room = roomController.getRoom(roomID);

        if (playerData.isMasterPlayer) {
            if (room.players.length > 0) {
                playerController.updateMasterPlayer(room.players[0].playerID);
                broadcastToAllSkipCurrentPlayer(room, {
                    type: 'master_player_updated',
                    masterplayerID: room.players[0].playerNR,
                    playerNR: room.players[0].playerNR,
                    playerID: room.players[0].playerID,
                    nickName: room.players[0].nickName,
                    message: "Master player updated"
                }, currentPlayer.playerID);


            }

        }

        playerController.removePlayer(currentPlayer.playerID)

        if (room) {
            broadcast(room, {
                type: 'player_left',
                nickName: currentPlayer.nickName,
                playerNR: currentPlayer.playerNR,
                playerID: currentPlayer.playerID
            });
            if (room.players.length === 0) {
                roomController.deleteRoom(roomID);
                console.log(`Room ${roomID} deleted because it's empty.`);
            }
        }
    });
    ws.on('error', (error) => console.error(`WebSocket error: ${error.message}`));

    // ws.on('close', () => {
    //     // const roomID = player.roomID;
    //     // if (roomID) {
    //     //     roomController.removePlayerFromRoom(roomID, playerID);
    //     // }
    //     // playerController.removePlayer(playerID);
    //     // console.log(`Player ${playerID} disconnected`); 
    //     console.log(`Player disconnected`);
    // });
});
