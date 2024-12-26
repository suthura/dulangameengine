function findRandomRoom(rooms, maxPlayers) {
    const availableRooms = Object.keys(rooms).filter(
        roomID => rooms[roomID].players.length < maxPlayers && rooms[roomID].isOpen
    );
    return availableRooms.length > 0 ? availableRooms[Math.floor(Math.random() * availableRooms.length)] : null;
}

module.exports = { findRandomRoom };
