import express from "express";
import http from "http";
import cors from "cors";
import { REDIS, FRONT_URL } from "../config/config";
import { createClient } from "redis";
import { joinUser, updateUserLocation } from "./utils/users";
import {
  createAmbulance,
  getCloserAmbulance,
  updateAmbulanceLocation,
} from "./utils/ambulances";
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
  console.log("New client connected to lifeline server", socket.id);
  // disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
  socket.on("user__joined", async (data) => {
    await joinUser({
      id: data?.id,
      username: data?.username,
      socketId: socket.id,
      location: data?.location,
    }).then((user) => {
      socket.emit("success__user__joined", user);
    });
  });
  socket.on("change__user__location", async (data) => {
    await updateUserLocation(socket.id, data?.location).then((user) => {
      socket.emit("success__change__user__location", user);
    });
  });
  socket.on("change__ambulance__location", async (data) => {
    await updateAmbulanceLocation(socket.id, data?.location).then(
      (ambulance) => {
        socket.emit("success__change__ambulance__location", ambulance);
      }
    );
  });
  // patient request ambulance
  socket.on("request__ambulance", async (data) => {
    // fetch ambulance from redis
    if (data?.location) {
      await getCloserAmbulance({
        userLocation: data?.location,
      }).then((ambulance) => {
        // if ambulance is available
        if (ambulance) {
          socket.emit("success__request__ambulance", ambulance);
        } else {
          // if ambulance is not available
          socket.emit("error__request__ambulance", "No ambulances available");
        }
      });
    } else {
      socket.emit("error__request__ambulance", "Location not provided");
    }
  });
  socket.on("ambulance__joined", async (data) => {
    await createAmbulance({
      ...data,
      id: data?.id,
      socketId: socket.id,
      location: data?.location,
    }).then((ambulance) => {
      socket.emit("success__ambulance__joined", ambulance);
    });
  });
});
export default server;
