import { isEmpty } from "./nativeMethods";
const { getCache, setCache, getKeys, delCache } = require("./redis");

async function createAmbulance({ id, socketId, location, data }) {
  const ambulance = { id, socketId, location, data };
  await setCache(`ambulance-${socketId}`, ambulance);
}
async function getAmbulance(id) {
  const data = await getCache(`ambulance-${id}`);
  return data;
}
async function getAmbulances() {
  const ambulances = await getKeys("ambulance-*");
  return ambulances;
}
async function updateAmbulanceStatus(id, status) {
  const data = await getCache(`ambulance-${id}`);
  if (!isEmpty(data)) {
    data.status = status;
    await setCache(`ambulance-${id}`, data);
  }
  return await getCache(`ambulance-${id}`);
}
async function updateAmbulanceLocation(id, location) {
  const data = await getCache(`ambulance-${id}`);
  if (!isEmpty(data)) {
    data.location = location;
    await setCache(`ambulance-${id}`, data);
  }
  return await getCache(`ambulance-${id}`);
}
async function getCloserAmbulance({ userLocation }) {
  const ambulances = await getKeys("ambulance-*");
  const { latitude: userLatitude, longitude: userLongitude } = userLocation;
  let closerAmbulance = null;
  let closerDistance = 0;
  ambulances.forEach((ambulance) => {
    const { latitude: ambulanceLatitude, longitude: ambulanceLongitude } =
      ambulance.location;
    const distance = Math.sqrt(
      Math.pow(userLatitude - ambulanceLatitude, 2) +
        Math.pow(userLongitude - ambulanceLongitude, 2)
    );
    if (closerDistance === 0 || distance < closerDistance) {
      closerDistance = distance;
      closerAmbulance = ambulance;
    }
  });

  return closerAmbulance;
}

module.exports = {
  createAmbulance,
  getAmbulance,
  getAmbulances,
  updateAmbulanceStatus,
  updateAmbulanceLocation,
  getCloserAmbulance,
};
