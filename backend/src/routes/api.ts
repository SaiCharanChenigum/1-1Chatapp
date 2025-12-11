import { Router } from 'express';
import { register, login, getMe, getAllUsers } from '../controllers/authController';
import { getMessages, uploadImage } from '../controllers/messageController';
import { authenticateToken } from '../middlewares/auth';
import multer from 'multer';

const router = Router();
const upload = multer(); // Memory storage handled by multer by default, which works for our S3 buffer upload

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticateToken, getMe);
router.get('/users', authenticateToken, getAllUsers);

// Messages
router.get('/messages', authenticateToken, getMessages);

// Upload
router.post('/upload', authenticateToken, upload.single('image'), uploadImage);

export default router;
