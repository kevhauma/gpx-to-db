import { Client } from "https://deno.land/x/postgres/mod.ts";
import { calculateSpeed } from "./calculateSpeed.ts";
import { parseGpx } from "./parse.ts";

const files = Array.from(Deno.readDirSync("./gpx/"));

const gpxTracks = files
  .filter((f) => f.name.endsWith(".gpx"))
  .map((f) => {
    const gpxString = Deno.readTextFileSync(`./gpx/${f.name}`);
    return parseGpx(gpxString, f.name);
  });

const speedMap = gpxTracks.map((track) => calculateSpeed(track.route));

const client = new Client({
  user: "postgres",
  database: "grafana",
  hostname: "localhost",
  port: 5432,
  tls: { enabled: false },
});

await client.connect();
