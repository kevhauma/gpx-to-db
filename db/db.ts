import { Client } from "https://deno.land/x/postgres@v0.19.3/client.ts";
import { coordToMeters } from "../utils/distanceUtils.ts";
import { log } from "../utils/logUtils.ts";
import { round } from "../utils/numberUtils.ts";
import { GpxTrack, SpeedPoint, SpeedPointDao } from "../utils/types.ts";

const client = new Client({
  user: "postgres",
  password: "admin",
  database: "grafana",
  hostname: "localhost",
  port: 5432,
  tls: { enabled: false },
});

await client.connect();

export const saveGpx = async ({
  id: routeId,
  name,
  duration,
  distance,
  date,
  route,
}: GpxTrack) => {
  const trackInsertTransaction = client.createTransaction("gpx_insert");
  log(`Saving ${name}`);
  log();
  log("Track Transaction Started");
  log("=========================");
  await trackInsertTransaction.begin();
  await trackInsertTransaction.queryArray(
    `INSERT INTO ROUTES (id,name,duration,distance,date) VALUES ('${routeId}', '${name}',${duration},${distance},'${date}');`
  );
  log("Committing Track Transaction...");
  await trackInsertTransaction.commit();
  log("Track Transaction Committed");

  log("==============================");

  log();
  log("TrackPoint Transaction Started");
  log("==============================");
  const trackPointInsertTransaction = client.createTransaction(`point_insert`);
  await trackPointInsertTransaction.begin();

  const trackPointsInsertPromises = route.map(
    async ({ id, lon, lat, time }) =>
      await trackPointInsertTransaction.queryArray(
        `INSERT INTO ROUTE_POINTS (id,route_id,longitude,latitude,timestamp) VALUES ('${id}','${routeId}',${lon},${lat},'${time}');`
      )
  );
  log(`Inserting ${route.length} points`);

  await Promise.all(trackPointsInsertPromises);
  log("Committing TrackPoint Transaction...");
  await trackPointInsertTransaction.commit();
  log("TrackPoint Transaction Committed");
};

type SpeedPointRecord = Record<string, SpeedPoint>;
type SpeedPointMapRecord = Record<string, Array<SpeedPoint>>;

const getCoordString = (
  { lat, lon }: { lat: number; lon: number },
  precision?: number
) => `${round(lat, precision)}:${round(lon, precision)}`;

const updatePoint = (dbPoint: SpeedPoint, point: SpeedPoint) => {
  const newTotalSpeed = dbPoint.speed * dbPoint.amount + point.speed;
  const newAmountOfDataPoints = dbPoint.amount + 1;
  const newAverageSpeed = newTotalSpeed / newAmountOfDataPoints;

  const amount = newAmountOfDataPoints;
  const speed = round(newAverageSpeed, 3);

  dbPoint.amount = amount;
  dbPoint.speed = speed;

  return { ...dbPoint, amount, speed };
};

export const saveSpeedMap = async (
  speedMap: Array<SpeedPoint>,
  SPEED_MAP_RESOLUTION: number = 15
) => {
  const speedMapTransaction = client.createTransaction(`speed_map`);
  log("SpeedMap Transaction Started");
  log("==============================");
  await speedMapTransaction.begin();
  log("Fetching SpeedMap Data");
  log("==============================");
  const dbSpeedPoints = await speedMapTransaction.queryObject<SpeedPointDao>(
    `SELECT speed, longitude, latitude, amount_of_data_points FROM SPEED_MAP`
  );
  log(`Fetched ${dbSpeedPoints.rowCount} Rows`);

  const speedPointsDict = dbSpeedPoints.rows.reduce((dict, spdpt) => {
    const mappedSpeedPoint = {
      lon: Number(spdpt.longitude),
      lat: Number(spdpt.latitude),
      speed: Number(spdpt.speed),
      amount: spdpt.amount_of_data_points,
    };
    const coordKey = getCoordString(mappedSpeedPoint, 3);
    if (dict[coordKey]) dict[coordKey].push(mappedSpeedPoint);
    else dict[coordKey] = [mappedSpeedPoint];
    return dict;
  }, {} as SpeedPointMapRecord);

  const insertSpeedPointsDict: SpeedPointMapRecord = {};

  const updatePoints: SpeedPointRecord = {};
  const insertPoints: SpeedPointRecord = {};
  log(`Checking ${speedMap.length} Speed Points`);
  speedMap.forEach((speedPoint) => {
    const coordKey = getCoordString(speedPoint, 3);
    const surroundingSpeedPoints = speedPointsDict[coordKey];
    const nearestSpeedPoint = surroundingSpeedPoints?.find(
      (surr) => coordToMeters(speedPoint, surr) < SPEED_MAP_RESOLUTION
    );

    if (nearestSpeedPoint) {
      const updatedPoint = updatePoint(nearestSpeedPoint, speedPoint);
      updatePoints[coordKey] = updatedPoint;
    } else {
      const surroundedInsertedSpeedPoint = insertSpeedPointsDict[coordKey];
      const insertedSpeedPoint = surroundedInsertedSpeedPoint?.find(
        (surr) => coordToMeters(speedPoint, surr) < SPEED_MAP_RESOLUTION
      );

      if (insertedSpeedPoint) {
        const newPoint = updatePoint(insertedSpeedPoint, speedPoint);
        insertPoints[getCoordString(insertedSpeedPoint, 6)] = newPoint;
      } else {
        const newPoint = {
          ...speedPoint,
          amount: 1,
        };
        if (insertSpeedPointsDict[coordKey])
          insertSpeedPointsDict[coordKey].push(newPoint);
        else insertSpeedPointsDict[coordKey] = [newPoint];

        insertPoints[getCoordString(speedPoint, 6)] = newPoint;
      }
    }
  });

  const updateEntries = Object.values(updatePoints);
  log(`Updating ${updateEntries.length} Speed Point Rows`);
  const speedMapUpdatePromises = updateEntries.map(
    ({ speed, amount, lat, lon }) => {
      return speedMapTransaction.queryArray(
        `UPDATE SPEED_MAP
       SET speed = ${speed}, amount_of_data_points = ${amount}
       WHERE latitude = ${lat} AND longitude = ${lon};`
      );
    }
  );
  const insertEntries = Object.values(insertPoints);
  log(`Inserting ${insertEntries.length} Speed Point Rows`);
  const speedMapInsertPromises = insertEntries.map(
    ({ speed, amount, lat, lon }) => {
      return speedMapTransaction.queryArray(
        `INSERT INTO SPEED_MAP (longitude,latitude,speed, amount_of_data_points)
       VALUES (${lon},${lat},${speed},${amount});`
      );
    }
  );

  await Promise.all([speedMapUpdatePromises, speedMapInsertPromises].flat());

  log("Committing SpeedMap Transaction...");
  await speedMapTransaction.commit();
  log("SpeedMap Transaction Comitted");
};

export const disconnect = () => client.end();
