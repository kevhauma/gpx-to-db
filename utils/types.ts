export type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type SpeedPointDao = {
  speed: number;
  longitude: number;
  latitude: number;
  amount_of_data_points: number;
};
export type SpeedPoint = {
  speed: number;
  lon: number;
  lat: number;
  amount: number;
};

export type GpxTrack = {
  id: UUID;
  name: string;
  duration: number;
  distance: number;
  date: string;
  route: Array<TrackPoint>;
};

export type TrackPoint = {
  id: UUID;
  lat: number;
  lon: number;
  distanceFromPreviousPoint: number;
  time: string;
};
