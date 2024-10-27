// src/sockets/index.ts

import { Server } from 'socket.io';
import { setupSignalNamespace } from './signalNamespace';

export function initializeSockets(io: Server) {
    const signalNamespace = io.of('/signal');
    setupSignalNamespace(signalNamespace);
}
