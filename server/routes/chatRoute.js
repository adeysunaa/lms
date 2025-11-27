import express from "express";
import { chat, getModels } from "../controllers/chatController.js";
import { protectUser } from "../middlewares/authMiddleware.js";

const chatRouter = express.Router();

chatRouter.post("/chat", protectUser, chat);
chatRouter.get("/models", protectUser, getModels);

export default chatRouter;

