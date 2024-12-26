const roomController = require("./roomController");


class MessageController {


    handleActionEvent(ws, message) {
        const { code, data, target } = message;
        const room = roomController.getRoom(ws.roomID); // Get the room of the player
        const senderID = ws.playerID;

        if (!room) {
            ws.send(
                JSON.stringify({
                    type: "error",
                    message: "Room not found.",
                })
            );
            return;
        }

        // Construct response
        const response = {
            type: "action_event",
            code,
            data,
            playerNR: room.players.findIndex((player) => player.playerID === senderID) + 1, // Get player's position in the room
            playerID: senderID,
        };

        if (target === "others") {
            // Broadcast to all players except the sender
            room.players.forEach((player) => {
                if (player.ws !== ws && player.ws.readyState === player.ws.OPEN) {
                    player.ws.send(JSON.stringify(response));
                }
            });
        } else {
            // Broadcast to all players including the sender
            room.players.forEach((player) => {
                if (player.ws.readyState === player.ws.OPEN) {
                    player.ws.send(JSON.stringify(response));
                }
            });
        }
    }
    
}

module.exports = new MessageController();
