import express from "express";
import http from "http";
import cors from "cors";
import { REDIS, FRONT_URL } from "../config/config";
import { createClient } from 'redis';

/* AUTHENTICATION SERVER NODE */
const app = express();
const server = http.createServer(app);
/* AUTHENTICATION REDIS */
const url = "redis://" + REDIS.HOST + ":" + REDIS.PORT;
export const client = createClient({ url: url });
client.on("connect", () => console.log("Connected to Redis!"));
client.on("error", (err) => console.log("Redis Client Error", err));
client.connect();

export const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
});

app.use(cors());
app.use(
  express.json({
    limit: "50mb",
  })
);
io.on("connection", (socket) => {
  // connection
  console.log("New client connected");
  // disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
export default server;
