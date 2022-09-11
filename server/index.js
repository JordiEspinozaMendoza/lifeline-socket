import express from "express";
import http from "http";
import cors from "cors";
import { REDIS, FRONT_URL } from "../config/config";
import { createClient } from "redis";
import {
  joinUser,
  updateUserLocation,
  getUsers,
  deleteUser,
} from "./utils/users";
import {
  createAmbulance,
  getCloserAmbulance,
  updateAmbulanceLocation,
  deleteAllAmbulances,
  getAmbulances,
  deleteAmbulance,
} from "./utils/ambulances";
import { createRoom, getRooms, deleteRoom } from "./utils/rooms";
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
    transports: ["websocket", "polling"],
  },
  
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  allowEIO3: true,
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
  socket.on("disconnect", async () => {
    deleteAmbulance(socket.id);
    deleteUser(socket.id);
    console.log("Client disconnected");
    await getAmbulances().then((ambulances) => {
      io.sockets.emit("all__ambulances", ambulances);
    });
    await getUsers().then((users) => {
      io.sockets.emit("all__users", users);
    });
  });
  socket.on("delete__ambulance", async (data) => {
    await deleteAmbulance(data).then(async () => {
      await getAmbulances().then((ambulances) => {
        socket.emit("all__ambulances", ambulances);
      });
    });
  });
  socket.on("delete__user", async (data) => {
    await deleteUser(data).then(async () => {
      await getUsers().then((users) => {
        socket.emit("all__users", users);
      });
    });
  });
  socket.on("user__joined", async (data) => {
    if (data) {
      await joinUser({
        id: data?.id,
        username: data?.username,
        socketId: socket.id,
        location: data?.location,
      }).then(async (user) => {
        socket.emit("success__user__joined", user);
        console.log("User joined", user);
        await getUsers().then((users) => {
          io.sockets.emit("all__users", users);
        });
      });
    } else {
      socket.emit("error__user__joined", "Error");
    }
  });
  socket.on("change__user__location", async (data) => {
    await updateUserLocation(socket.id, {
      latitude: data?.latitude,
      longitude: data?.longitude,
    }).then(async () => {
      // socket.emit("success__change__user__location", user);
      socket.broadcast.to(data.room).emit("patient__change__location", {
        latitude: data?.latitude,
        longitude: data?.longitude,
      });
      await getUsers().then((users) => {
        io.sockets.emit("all__users", users);
      });
    });
  });
  socket.on("change__ambulance__location", async (data) => {
    await updateAmbulanceLocation(socket.id, {
      latitude: data?.latitude,
      longitude: data?.longitude,
    }).then(async () => {
      // socket.emit("success__change__user__location", user);
      socket.broadcast.to(data.room).emit("ambulance__change__location", {
        latitude: data?.latitude,
        longitude: data?.longitude,
      });
      await getAmbulances().then((ambulances) => {
        io.sockets.emit("all__ambulances", ambulances);
      });
    });
  });
  socket.on("send__message", async (data) => {
    console.log("send__message", data);
    socket.broadcast.to(data.room).emit("receive__message", {
      message: data?.message,
      user: data?.username,
    });
  });
  // patient request ambulance
  socket.on("ambulance__join__room", ({ room }) => {
    socket.join(room);
  });
  socket.on("request__ambulance", async (data) => {
    socket.emit("searching__ambulance", "Searching ambulance");
    if (data?.location) {
      await getCloserAmbulance({
        userLocation: data?.location,
      }).then(async (ambulance) => {
        if (
          ambulance &&
          ambulance.location.latitude &&
          ambulance.location.longitude
        ) {
          await createRoom({
            room: `${socket.id}-${ambulance.socketId}`,
            ambulance: ambulance,
            patient: {
              id: data?.id,
              username: data?.username,
              socketId: socket.id,
            },
            location: {
              patient: data?.location,
              ambulance: ambulance.location,
            },
          }).then(async (room) => {
            socket.join(room.room);
            socket.emit("ambulance__found", {
              ...ambulance,
              myLocation: data?.location,
              room: room.room,
            });
            // alert ambulance to accept request
            io.to(ambulance.socketId).emit("alert__ambulance", {
              ...data,
              userLocation: data?.location,
              room: room.room,
            });
            await getRooms().then((rooms) => {
              io.sockets.emit("all__rooms", rooms);
            });
          });
        } else {
          socket.emit("ambulances__not__found", "Ambulances not found");
        }
      });
    } else {
      socket.emit("error__request__ambulance", "Location not provided");
    }
  });
  socket.on("get__all__ambulances", async () => {
    await getAmbulances().then((ambulances) => {
      socket.emit("all__ambulances", ambulances);
    });
  });
  socket.on("get__all__rooms", async () => {
    await getRooms().then((rooms) => {
      socket.emit("all__rooms", rooms);
    });
  });
  socket.on("ambulance__joined", async (data) => {
    console.log("ambulance__joined", data);
    await createAmbulance({
      ...data,
      id: data?.id,
      socketId: socket.id,
      location: data?.location,
    }).then(async (ambulance) => {
      socket.emit("success__ambulance__joined", ambulance);

      // emit all ambulances to all users
      await getAmbulances().then((ambulances) => {
        io.sockets.emit("all__ambulances", ambulances);
      });
    });
  });
  socket.on("delete__all__ambulances", async () => {
    await deleteAllAmbulances().then(async () => {
      await getAmbulances().then((ambulances) => {
        socket.emit("all__ambulances", ambulances);
      });
    });
  });
  socket.on("get__all__users", async () => {
    await getUsers().then((users) => {
      socket.emit("all__users", users);
    });
  });
  socket.on("delete__room", async (data) => {
    await deleteRoom(data).then(async () => {
      await getRooms().then((room) => {
        socket.emit("all__rooms", room);
      });
    });
  });
});
export default server;
