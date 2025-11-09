const {Server}= require("socket.io");
let io;
const onlineUsers = new Map();
class Socket {
    initSocket = (server) => {
        io = new Server(server, {
            cors: {
                origin: "http://localhost:3001",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        io.on("connection", (socket) => {
            console.log('New client connected:', socket.id);
            socket.on('user:connect', (userId) => {
                onlineUsers.set(userId, socket.id);
                console.log('Online users:', Array.from(onlineUsers.keys()));
            });
            socket.on('chat:private', ({ toUserId, message, fromUserId }) => {
                const targetSocketId = onlineUsers.get(toUserId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('chat:private', { message, fromUserId });
                }
            });
            socket.on('room:join', ({ roomId }) => {
                socket.join(roomId);
                console.log(`${socket.id} joined room ${roomId}`);
            });
            socket.on('chat:group', ({ roomId, message, fromUserId }) => {
                io.to(roomId).emit('chat:group', { message, fromUserId, roomId });
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                for (let [userId, sId] of onlineUsers.entries()) {
                    if (sId === socket.id) onlineUsers.delete(userId);
                }
            });
        })
    }
    getIO = () => {
        if (!io) throw new Error('Socket.io not initialized!');
        return io;

    }
    getOnlineUsers = () => onlineUsers;
}

module.exports = new Socket();