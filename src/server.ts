import express from 'express';
import path from 'path';
import http from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import { UserInterface } from './interface/UserInterface';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server);

server.listen(process.env.PORT);

app.use(express.static(path.join(__dirname, '../public')));

const users: UserInterface[] = [];

io.on('connection', (socket: Socket) => {
    console.log('Conectado no servidor', socket.id);

    socket.on('join-request',  (obj) => {
        const user: UserInterface = {
            id: socket.id,
            username: obj?.username,
            cor: obj?.cor,
            socketId: socket.id,
        };

        users.push(user);
        console.log('usuarios registrado', user);

        socket.emit('user-ok', users);

        socket.broadcast.emit('list-update', {
            joined: obj?.username,
            list: users
        });
    });

    socket.on('disconnect', () => {
        const index = users.findIndex((user) => user.id === socket.id);

        if (index !== -1) {
            const disconnectedUser = users.splice(index, 1)[0];
            console.log('Usuário desconectado:', disconnectedUser);
      
            // Notificar outros usuários sobre a desconexão do usuário
            socket.broadcast.emit('user-disconnected', disconnectedUser);
        }
    });

    socket.on('send-message', (message: string, recipientId: string) => {
        const sender = users.find((user) => user.id === socket.id);
        const recipient = users.find((user) => user.id === recipientId);

        let obj = {
            sender,
            message: message,
            recipient,
        }
    
        if (sender && recipient) {
          socket.emit('show-msg', obj);
          // Enviar mensagem para o destinatário
          io.to(recipient.socketId).emit('receive-message', {
            sender,
            message,
          });
        }
    });
   
    socket.on('send-broadcast', (txt: string ) => {
        const sender = users.find((user) => user.id === socket.id);

        let obj = {
            sender,
            message: txt
        }

        socket.emit('show-msg', obj);
        socket.broadcast.emit('show-msg', obj)
    });
});
