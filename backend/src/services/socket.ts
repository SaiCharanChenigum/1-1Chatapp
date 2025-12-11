import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '../utils/prisma';

interface ServerToClientEvents {
    'message:new': (message: any) => void;
    'typing': (data: { fromUserId: string, isTyping: boolean }) => void;
}

interface ClientToServerEvents {
    'join': (userId: string) => void;
    'message:send': (data: { toUserId: string; text?: string; imageUrl?: string }) => void;
    'typing': (data: { toUserId: string, isTyping: boolean }) => void;
}

interface InterServerEvents { }

interface SocketData {
    userId: string;
}

export const setupSocket = (io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    io.on('connection', (socket) => {
        // console.log('User connected:', socket.id);

        socket.on('join', (userId) => {
            socket.data.userId = userId;
            socket.join(userId); // Join a room named after the user ID
            // console.log(`User ${userId} joined room ${userId}`);
        });

        socket.on('message:send', async ({ toUserId, text, imageUrl }) => {
            const fromUserId = socket.data.userId;
            if (!fromUserId) return;

            try {
                const message = await prisma.message.create({
                    data: {
                        fromUserId,
                        toUserId,
                        text,
                        imageUrl,
                    },
                    include: {
                        fromUser: { select: { username: true } }
                    }
                });

                // Emit to receiver
                io.to(toUserId).emit('message:new', message);
                // Emit back to sender (so they get the real ID and timestamp)
                io.to(fromUserId).emit('message:new', message);

            } catch (error) {
                console.error('Message send error:', error);
            }
        });

        socket.on('typing', ({ toUserId, isTyping }) => {
            const fromUserId = socket.data.userId;
            if (!fromUserId) return;
            io.to(toUserId).emit('typing', { fromUserId, isTyping });
        });

        socket.on('disconnect', async () => {
            if (socket.data.userId) {
                await prisma.user.update({
                    where: { id: socket.data.userId },
                    data: { lastSeenAt: new Date() }
                }).catch(() => { }); // ignore error if user deleted etc
            }
        });
    });
};
