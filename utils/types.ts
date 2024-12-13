type UUID = `${string}-${string}-${string}-${string}-${string}`;
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
  elevation: number;
  distanceFromPreviousPoint: number;
  time: string;
};

export type XmlChild = {
  name: string;
  attributes: Record<string, string>;
  children: Array<XmlChild>;
  content: string;
};

export type XmlDoc = {
  root: {
    children: Array<XmlChild>;
  };
};
