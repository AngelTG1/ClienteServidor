import express, {NextFunction, Request, Response} from 'express';
import * as crypto from 'crypto';

const app = express();
const port = 3000;

app.use(express.json())


app.get('/', (req: Request, res: Response) => {

    res.status(200).json({
        succes: true
    })
}); 

// debe de estar en env
const WEBHOOK_URL_DISCORD = "https://discord.com/api/webhooks/1204800883905400872/e1q89pmfLh1FynU30SdkeztF58t-jl03Dotx7rxwzfRKIWNxt8tIeC60-SAMWY5wB-bn"
const WEBHOOK_SECRET = '757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17';


const verify_signuture = (req: Request) => {
    try {
        const signuture = crypto
            .createHmac("sha256", WEBHOOK_SECRET)
            .update(JSON.stringify(req.body))
            .digest("hex")

        let trusted = Buffer.from(`sha256=${signuture}`, `ascii`);
        let untrusted = Buffer.from(req.header("x-hub-signature-256") || '', 'ascii');
        return crypto.timingSafeEqual(trusted, untrusted);    
    } catch (error) {
        return false;
    }
}

const verifySignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if(!verify_signuture(req)) {
        res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
        return;
    }

    next();
}

const notifyDiscord = async (message: string) => {

    const body = {
        content: message
    }

    const resp = await fetch(WEBHOOK_URL_DISCORD, {
        method: "POST",
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(body)
    });
        
    if(!resp.ok) {
        console.log('error al enviar informacion a discord')
        return false;
    }

    return true;
}

app.post('/github-event', verifySignatureMiddleware, (req: Request, res: Response) => {
    const { body } = req;
    const {action, sender, repository} = body; 
    const event = req.header('x-github-event');
    let message = "";

    switch(event){
        case "star":
            message =`${sender.login} ${action} star on ${repository.full_name}`
        break;    
        case "issues":
            const { issue } = body;
            message = `${sender.login} ${action} issue ${issue.title} on ${repository.full_name}`
        break;
        case "push": 
            message = `${sender.login} ${action} push on ${repository.full_name}`
        break;
        default:
            message = `enevnto desconocido: ${event}`
        break;        

    }

    notifyDiscord(message)
    
    res.status(200).json({
        success: true
    })
})

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
