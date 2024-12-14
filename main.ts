import { calculateSpeed } from "./utils/calculateSpeed.ts";
import { parseGpxAsync } from "./parse.ts";
import { log } from "./utils/logUtils.ts";
import { disconnect, saveSpeedMap } from "./db/db.ts";

const files = Array.from(Deno.readDirSync("./gpx/"));

log("Parsing Gpx files Started");
log("=========================");
log(`Parsing ${files.length} files`);
const gpxTracksPromises = files
  .filter((f) => f.name.endsWith(".gpx"))
  .map((f, index) => {
    log(`Parsing ${index + 1}/${files.length}: ${f.name}`);
    const gpxString = Deno.readTextFileSync(`./gpx/${f.name}`);
    return parseGpxAsync(gpxString, f.name);
  });
const gpxTracks = await Promise.all(gpxTracksPromises);
for (const gpxTrack of gpxTracks) {
  //await saveGpx(gpxTrack);
  const speedmap = calculateSpeed(gpxTrack.route);
  await saveSpeedMap(speedmap);
}

disconnect();
