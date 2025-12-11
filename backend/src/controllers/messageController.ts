import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';
import { uploadFileToR2 } from '../utils/s3';

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { withUserId } = req.query;

        if (!withUserId) {
            // Optional: List recent conversations if needed, but for 1-to-1 spec, we usually just need chat with specific user.
            // For now, let's just return error if no partner specified, or all messages involving this user.
            // The spec says: GET /api/messages?withUserId=ID
            return res.status(400).json({ error: 'withUserId is required' });
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { fromUserId: userId, toUserId: String(withUserId) },
                    { fromUserId: String(withUserId), toUserId: userId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

export const uploadImage = async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Validate file type if needed (e.g. strict to images)

        const imageUrl = await uploadFileToR2(req.file);
        res.json({ imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Image upload failed' });
    }
};
