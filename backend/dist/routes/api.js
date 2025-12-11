"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const messageController_1 = require("../controllers/messageController");
const auth_1 = require("../middlewares/auth");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)(); // Memory storage handled by multer by default, which works for our S3 buffer upload
// Auth
router.post('/auth/register', authController_1.register);
router.post('/auth/login', authController_1.login);
router.get('/auth/me', auth_1.authenticateToken, authController_1.getMe);
router.get('/users', auth_1.authenticateToken, authController_1.getAllUsers);
// Messages
router.get('/messages', auth_1.authenticateToken, messageController_1.getMessages);
// Upload
router.post('/upload', auth_1.authenticateToken, upload.single('image'), messageController_1.uploadImage);
exports.default = router;
