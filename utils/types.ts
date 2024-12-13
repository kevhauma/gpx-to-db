export type SpeedPoint = {
  speed: number;
  lon: number;
  lat: number;
};

export type GpxTrack = {
  name: string;
  duration: number;
  distance: number;
  date: string;
  route: Array<TrackPoint>;
};

export type TrackPoint = {
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
