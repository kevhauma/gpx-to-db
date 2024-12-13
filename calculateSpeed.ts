import { coordToMeters } from "./utils/distanceUtils.ts";
import { SpeedPoint, TrackPoint } from "./utils/types.ts";

export const calculateSpeed = (points: Array<TrackPoint>) => {
  const speeds: Array<SpeedPoint> = [];

  points.forEach((point, index) => {
    const prevPoint = points[index - 1];
    if (!prevPoint) return;

    const timeBetweenInSeconds =
      (new Date(point.time).getTime() - new Date(prevPoint.time).getTime()) /
      1000;
    const lon = (point.lon + prevPoint.lon) / 2;
    const lat = (point.lat + prevPoint.lat) / 2;

    const speedInMetersPerSecond =
      point.distanceFromPreviousPoint / timeBetweenInSeconds;
    const speedInKilometersPerHour = speedInMetersPerSecond * 3.6;

    speeds.push({ lon, lat, speed: speedInKilometersPerHour });
  });
  return speeds;
};
