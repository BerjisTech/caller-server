import "reflect-metadata";
import express, { Application } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { AppDataSource } from './src/ormconfig';
import { initializeSockets } from './src/sockets';
import { Room } from "./src/models/Room";
import { Profile } from "./src/models/Profile";
import { RoomMember } from "./src/models/RoomMember";
import { RoomMessage } from "./src/models/RoomMessage";

const app: Application = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: '/socket.io',
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

AppDataSource.initialize().then(() => {

    initializeSockets(io);

    // Root path
    app.get('/', (req, res) => {
        res.send('Hello, World!');
    });

    // Start the server
    server.listen(3006, () => {
        console.log('Listening on *:3006');
    });

}).catch((error: any) => console.log("TypeORM initialization error:", error));
