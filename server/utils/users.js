import { isEmpty } from "./nativeMethods";
const { getCache, setCache, getKeys, delCache } = require("./redis");
async function joinUser(id, username, room) {
  const user = { id, username };
  await setCache(id, user);
  return user;
}
async function getUser(id) {
  const user = await getCache(id);
  return user;
}
async function getUsers() {
  const users = await getKeys();
  return users;
}
async function deleteUser(id) {
  await delCache(id);
}
module.exports = {
  joinUser,
  getUser,
  getUsers,
  deleteUser,
};
