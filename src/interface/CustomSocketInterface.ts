import { Socket } from "socket.io";

export interface CustomSocketInterface extends Socket {
    username?: string;
}
