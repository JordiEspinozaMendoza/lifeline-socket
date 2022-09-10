import { isEmpty } from "./nativeMethods";
const { getCache, setCache, getKeys, delCache } = require("./redis");

async function createRoom(data) {
  await setCache(data.room, {
    room: data.room,
    ambulance: data.ambulance,
    patient: data.patient,
    status: "waiting",
    location: {
      patient: data.location.patient,
      ambulance: data.location.ambulance,
    },
  });
}
async function getRoom(room) {
  const data = await getCache(room);
  return data;
}
async function getRooms() {
  const rooms = await getKeys();
  return rooms;
}
async function updateRoomStatus(room, status) {
  const data = await getCache(room);
  if (!isEmpty(data)) {
    data.status = status;
    await setCache(room, data);
  }
  return await getCache(room);
}
module.exports = {
  createRoom,
  getRoom,
  getRooms,
  updateRoomStatus,
};
