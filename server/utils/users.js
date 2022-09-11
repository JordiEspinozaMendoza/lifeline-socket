import { isEmpty } from "./nativeMethods";
const { getCache, setCache, getKeys, delCache } = require("./redis");
async function joinUser({ id, username, socketId, location }) {
  const user = { id, username, socketId, location };
  await setCache(`user-${socketId}`, user);
  return user;
}
async function getUser(id) {
  const user = await getCache(`user-${id}`);
  return user;
}
async function getUsers() {
  const users = await getKeys("user-*");
  const usersData = [];
  if (users) {
    for (let i = 0; i < users.length; i++) {
      const user = await getCache(users[i]);
      usersData.push(user);
    }
  }
  return usersData;
}
async function deleteUser(id) {
  await delCache(`user-${id}`);
}
async function updateUserLocation(id, location) {
  const user = await getCache(`user-${id}`);
  let room = "";
  if (!isEmpty(user)) {
    user.location = location;
    await setCache(`user-${id}`, user);
    // found room where user is patient
    const rooms = await getKeys("room-*");
    if (rooms) {
      for (let i = 0; i < rooms.length; i++) {
        const room = await getCache(rooms[i]);
        if (room.patient.socketId === id) {
          room.location.patient = location;
          await setCache(`room-${room.room}`, room);
        }
        room = room.room;
      }
    }
  }
  return {
    room,
  };
}
module.exports = {
  joinUser,
  getUser,
  getUsers,
  deleteUser,
  updateUserLocation,
};
