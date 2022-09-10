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
  return users;
}
async function deleteUser(id) {
  await delCache(`user-${id}`);
}
async function updateUserLocation(id, location) {
  const user = await getCache(`user-${id}`);
  if (!isEmpty(user)) {
    user.location = location;
    await setCache(`user-${id}`, user);
  }
  return await getCache(`user-${id}`);
}
module.exports = {
  joinUser,
  getUser,
  getUsers,
  deleteUser,
  updateUserLocation,
};
