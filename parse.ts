import GPX from "gpx-parse";
import { coordToMeters } from "./utils/distanceUtils.ts";
import { TrackPoint, UUID } from "./utils/types.ts";
import { GpxTrack } from "./utils/types.ts";

type GpxDocTrackPoint = {
  id: UUID;
  time: Date;
  lat: number;
  lon: number;
  elevation: number;
  distanceFromPreviousPoint: number;
};

type GpxDocSegment = Array<GpxDocTrackPoint>;
type GpxDocTrack = { segments: Array<GpxDocSegment>; name: string };
type GpxDoc = {
  metadata: {
    time?: number;
  };
  tracks: Array<GpxDocTrack>;
};
export const parseGpxAsync = (gpxString: string, gpxName: string) => {
  return new Promise<GpxTrack>((res, rej) => {
    try {
      GPX.parseGpx(gpxString, (error: unknown, data: GpxDoc) => {
        let gpxDate: Date;
        if (error) throw error;

        let trackPoints: Array<TrackPoint> = [];
        if (!data) throw "no data found";
        data.tracks.forEach((t) => {
          t.segments.forEach((seg) => {
            seg.forEach((point, i) => {
              const prev = trackPoints[trackPoints.length - 1];
              const distanceInMeters = !prev ? 0 : coordToMeters(point, prev);

              const time = point.time || new Date();
              if (!point.time) time.setSeconds(i);
              if (!gpxDate) gpxDate = time;
              trackPoints.push({
                id: crypto.randomUUID(),
                lat: Number(point.lat),
                lon: Number(point.lon),
                time: time.toISOString(),
                ele: Number(point.elevation),
                distanceFromPreviousPoint: distanceInMeters,
              });
            });
          });
        });

        const distance = trackPoints.reduce(
          (distance, { distanceFromPreviousPoint }) =>
            distance + distanceFromPreviousPoint,
          0
        );
        const duration =
          (new Date(trackPoints[trackPoints.length - 1].time).getTime() -
            new Date(trackPoints[0].time).getTime()) /
          1000;

        res({
          id: crypto.randomUUID(),
          name: gpxName,
          distance,
          duration,
          date: gpxDate.toISOString(),
          route: trackPoints,
        });
      });
    } catch (e) {
      console.log(`ERROR`);
      console.log(e);
      rej("");
    }
  });
};
