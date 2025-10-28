import express, {type Express} from "express";
import dotenv from "dotenv";
import http from 'http';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;


app.use(express.json());

try {
    const httpServer = http.createServer(app);
    httpServer.listen(port, () => {
        console.log(`[Server]: HTTP Server now running at http://localhost:${port}`);
    });
} catch (error) {
    console.error('Failed to start HTTP server:', error);
}