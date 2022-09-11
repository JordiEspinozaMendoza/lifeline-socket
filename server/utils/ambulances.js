import { isEmpty } from "./nativeMethods";
const { getCache, setCache, getKeys, delCache } = require("./redis");

async function createAmbulance({ id, socketId, location, data }) {
  const ambulance = { id, socketId, location, data };
  // get all ambulances
  const ambulances = await getKeys("ambulance-*");
  await setCache(`ambulance-${socketId}`, ambulance);
}
async function getAmbulance(id) {
  const data = await getCache(`ambulance-${id}`);
  return data;
}
async function getAmbulances() {
  const ambulances = await getKeys("ambulance-*");
  const ambulancesData = [];
  if (ambulances) {
    for (let i = 0; i < ambulances.length; i++) {
      const ambulance = await getCache(ambulances[i]);
      ambulancesData.push(ambulance);
    }
  }
  return ambulancesData;
}
async function updateAmbulanceStatus(id, status) {
  const data = await getCache(`ambulance-${id}`);
  if (!isEmpty(data)) {
    data.status = status;
    await setCache(`ambulance-${id}`, data);
  }
  return await getCache(`ambulance-${id}`);
}
async function getCloserAmbulance({ userLocation }) {
  const ambulances = await getKeys("ambulance-*");
  const { latitude: userLatitude, longitude: userLongitude } = userLocation;
  let closerAmbulance = null;
  let closerDistance = 0;
  if (ambulances) {
    // ambulances
    //   .filter((ambulance) => ambulance?.location)
    //   .forEach((ambulance) => {
    //     if (ambulance.location.latitude && ambulance.location.longitude) {
    //       const { latitude: ambulanceLatitude, longitude: ambulanceLongitude } =
    //         ambulance.location;
    //       const distance = Math.sqrt(
    //         Math.pow(userLatitude - ambulanceLatitude, 2) +
    //           Math.pow(userLongitude - ambulanceLongitude, 2)
    //       );
    //       if (closerDistance === 0 || distance < closerDistance) {
    //         closerDistance = distance;
    //         closerAmbulance = ambulance;
    //       }
    //     }
    //   });
    // return a random ambulance
    const randomAmbulance =
      ambulances[Math.floor(Math.random() * ambulances.length)];
    return await getCache(randomAmbulance);
  } else {
    return null;
  }
}
async function updateAmbulanceLocation(id, location) {
  const ambulance = await getCache(`ambulance-${id}`);
  let room = "";
  if (!isEmpty(ambulance)) {
    ambulance.location = location;
    await setCache(`ambulance-${id}`, ambulance);
    // found room where user is ambulance
    const rooms = await getKeys("room-*");
    if (rooms) {
      for (let i = 0; i < rooms.length; i++) {
        const room = await getCache(rooms[i]);
        if (room.ambulance.socketId === id) {
          room.location.ambulance = location;
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
async function deleteAmbulance(id) {
  delCache(`ambulance-${id}`);
  console.log("Ambulance deleted");
}
async function deleteAllAmbulances() {
  const ambulances = await getKeys("ambulance-*");
  if (ambulances) {
    ambulances.forEach((ambulance) => {
      delCache(`ambulance-${ambulance.id}`);
    });
  }
  console.log("All ambulances deleted");
}

module.exports = {
  createAmbulance,
  getAmbulance,
  getAmbulances,
  updateAmbulanceStatus,
  updateAmbulanceLocation,
  getCloserAmbulance,
  deleteAllAmbulances,
  deleteAmbulance,
};
