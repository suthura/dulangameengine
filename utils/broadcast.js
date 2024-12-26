const { WebSocket } = require("ws");

function broadcast(room, message, sender = null) {
    room.players.forEach((player, index) => {
        // Skip if the player's WebSocket is undefined or closed
        if (!player.ws || player.ws.readyState !== WebSocket.OPEN) {
            console.warn(`Skipping player ${player.playerID}. WebSocket is not open.`);
            return;
        }

        try {
            if (player.ws !== sender) {
                player.ws.send(JSON.stringify(message));
            }
        } catch (err) {
            console.error(`Error broadcasting to player ${player.playerID}:`, err.message);
        }
    });
}
function broadcastToMasterPlayer(room, message, playerData) {
    room.players.forEach((player, index) => {
        if (player.isMasterPlayer) {
            player.ws.send(JSON.stringify(message));
        }
    });
}
function broadcastToAllPlayer(room, message) {
    room.players.forEach((player, index) => {
        player.ws.send(JSON.stringify(message));
    });
}
function broadcastToAllSkipCurrentPlayer(room, message, playerId) {
    room.players.forEach((player, index) => {
        if (player.playerID !== playerId)
            player.ws.send(JSON.stringify(message));
    });
}

module.exports = { broadcast, broadcastToMasterPlayer, broadcastToAllPlayer, broadcastToAllSkipCurrentPlayer };
