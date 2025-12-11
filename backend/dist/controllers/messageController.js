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
exports.uploadImage = exports.getMessages = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const s3_1 = require("../utils/s3");
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.user;
        const { withUserId } = req.query;
        if (!withUserId) {
            // Optional: List recent conversations if needed, but for 1-to-1 spec, we usually just need chat with specific user.
            // For now, let's just return error if no partner specified, or all messages involving this user.
            // The spec says: GET /api/messages?withUserId=ID
            return res.status(400).json({ error: 'withUserId is required' });
        }
        const messages = yield prisma_1.default.message.findMany({
            where: {
                OR: [
                    { fromUserId: userId, toUserId: String(withUserId) },
                    { fromUserId: String(withUserId), toUserId: userId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
exports.getMessages = getMessages;
const uploadImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Validate file type if needed (e.g. strict to images)
        const imageUrl = yield (0, s3_1.uploadFileToR2)(req.file);
        res.json({ imageUrl });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Image upload failed' });
    }
});
exports.uploadImage = uploadImage;
