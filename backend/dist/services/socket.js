"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const setupSocket = (io) => {
    io.on('connection', (socket) => {
        // console.log('User connected:', socket.id);
        socket.on('join', (userId) => {
            socket.data.userId = userId;
            socket.join(userId); // Join a room named after the user ID
            // console.log(`User ${userId} joined room ${userId}`);
        });
        socket.on('message:send', (_a) => __awaiter(void 0, [_a], void 0, function* ({ toUserId, text, imageUrl }) {
            const fromUserId = socket.data.userId;
            if (!fromUserId)
                return;
            try {
                const message = yield prisma_1.default.message.create({
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
            }
            catch (error) {
                console.error('Message send error:', error);
            }
        }));
        socket.on('typing', ({ toUserId, isTyping }) => {
            const fromUserId = socket.data.userId;
            if (!fromUserId)
                return;
            io.to(toUserId).emit('typing', { fromUserId, isTyping });
        });
        socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
            if (socket.data.userId) {
                yield prisma_1.default.user.update({
                    where: { id: socket.data.userId },
                    data: { lastSeenAt: new Date() }
                }).catch(() => { }); // ignore error if user deleted etc
            }
        }));
    });
};
exports.setupSocket = setupSocket;
