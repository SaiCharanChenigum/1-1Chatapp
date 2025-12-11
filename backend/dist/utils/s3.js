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
exports.uploadFileToR2 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const s3Client = new client_s3_1.S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY || '',
        secretAccessKey: process.env.R2_SECRET_KEY || '',
    },
});
const uploadFileToR2 = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = `${Date.now()}-${file.originalname}`;
    yield s3Client.send(new client_s3_1.PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    }));
    // If using a public CDN/Custom Domain
    if (process.env.CDN_URL) {
        return `${process.env.CDN_URL}/${fileName}`;
    }
    // Otherwise return the public R2 URL (if bucket is public) or we would generate a signed url
    // For this chat app, assuming public bucket for simplicity or mapped domain
    return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${fileName}`;
});
exports.uploadFileToR2 = uploadFileToR2;
