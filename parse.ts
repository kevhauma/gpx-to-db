import gpxParser from "xml-parser";
import { GpxTrack, TrackPoint, XmlDoc } from "./utils/types.ts";
import { coordToMeters } from "./utils/distanceUtils.ts";

export const parseGpx = (gpxString: string, gpxName: string): GpxTrack => {
  const xmlDoc: XmlDoc = gpxParser(gpxString);

  const tracks = xmlDoc.root.children.filter((child) => child.name === "trk");

  const metadate = xmlDoc.root.children.find(
    (child) => child.name === "metadate"
  )?.content;
  const metadata = xmlDoc.root.children.find(
    (child) => child.name === "metadata"
  );

  const metaDataTime = metadata?.children.find(
    (child) => child.name === "time"
  )?.content;

  const exerciseInfo = xmlDoc.root.children.find(
    (child) => child.name === "exerciseinfo"
  );
  const distanceStr = exerciseInfo?.children.find(
    (child) => child.name === "distance"
  )?.content;
  const durationStr = exerciseInfo?.children.find(
    (child) => child.name === "duration"
  )?.content;

  const trackSegments = tracks
    .map((track) => track.children.filter((child) => child.name === "trkseg"))
    .flat();

  const trackPoints = trackSegments
    .map((segment) =>
      segment.children.filter((child) => child.name === "trkpt")
    )
    .flat();

  const parsedPoints: TrackPoint[] = [];

  trackPoints.forEach((trkpt) => {
    const lat = parseFloat(trkpt.attributes["lat"]);
    const lon = parseFloat(trkpt.attributes["lon"]);
    const time =
      trkpt.children.find((child) => child.name === "time")?.content ||
      new Date().toISOString();
    const elevation = parseFloat(
      trkpt.children.find((child) => child.name === "ele")?.content || "0"
    );

    const prev = parsedPoints[parsedPoints.length - 1];
    const distanceInMeters = !prev ? 0 : coordToMeters({ lon, lat }, prev);

    parsedPoints.push({
      lat,
      lon,
      time,
      elevation,
      distanceFromPreviousPoint: distanceInMeters,
    });
  });

  const distance = distanceStr
    ? parseFloat(distanceStr)
    : parsedPoints.reduce(
        (distance, { distanceFromPreviousPoint }) =>
          distance + distanceFromPreviousPoint,
        0
      );
  const duration = durationStr
    ? parseFloat(durationStr)
    : (new Date(parsedPoints[parsedPoints.length - 1].time).getTime() -
        new Date(parsedPoints[0].time).getTime()) /
      1000;

  return {
    name: gpxName,
    distance,
    duration,
    date: metadate || metaDataTime || new Date().toISOString(),
    route: parsedPoints,
  };
};
