import { TrackPoint } from "./types.ts";

export const toRadians = (degrees: number) => degrees * (Math.PI / 180);

type Coord = Pick<TrackPoint, "lat" | "lon">;
export const coordToMeters = (p1: Coord, p2: Coord) => {
  let R = 6371e3;
  let φ1 = toRadians(p1.lat);
  let φ2 = toRadians(p2.lat);
  let Δφ = toRadians(p2.lat - p1.lat);
  let Δλ = toRadians(p2.lon - p1.lon);

  let a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  let d = R * c;

  return d;
};
