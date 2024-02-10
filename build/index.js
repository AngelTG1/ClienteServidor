"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importDefault(require("express"));
const crypto = __importStar(require("crypto"));
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.status(200).json({
        succes: true
    });
});
// debe de estar en env
const WEBHOOK_URL_DISCORD = "https://discord.com/api/webhooks/1204800883905400872/e1q89pmfLh1FynU30SdkeztF58t-jl03Dotx7rxwzfRKIWNxt8tIeC60-SAMWY5wB-bn";
const WEBHOOK_SECRET = '757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17';
const verify_signuture = (req) => {
    try {
        const signuture = crypto
            .createHmac("sha256", WEBHOOK_SECRET)
            .update(JSON.stringify(req.body))
            .digest("hex");
        let trusted = Buffer.from(`sha256=${signuture}`, `ascii`);
        let untrusted = Buffer.from(req.header("x-hub-signature-256") || '', 'ascii');
        return crypto.timingSafeEqual(trusted, untrusted);
    }
    catch (error) {
        return false;
    }
};
const verifySignatureMiddleware = (req, res, next) => {
    if (!verify_signuture(req)) {
        res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
        return;
    }
    next();
};
const notifyDiscord = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const body = {
        content: message
    };
    const resp = yield fetch(WEBHOOK_URL_DISCORD, {
        method: "POST",
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!resp.ok) {
        console.log('error al enviar informacion a discord');
        return false;
    }
    return true;
});
app.post('/github-event', verifySignatureMiddleware, (req, res) => {
    const { body } = req;
    const { action, sender, repository } = body;
    const event = req.header('x-github-event');
    let message = "";
    switch (event) {
        case "star":
            message = `${sender.login} ${action} star on ${repository.full_name}`;
            break;
        case "issues":
            const { issue } = body;
            message = `${sender.login} ${action} issue ${issue.title} on ${repository.full_name}`;
            break;
        case "push":
            message = `${sender.login} ${action} push on ${repository.full_name}`;
            break;
        default:
            message = `enevnto desconocido: ${event}`;
            break;
    }
    notifyDiscord(message);
    res.status(200).json({
        success: true
    });
});
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
