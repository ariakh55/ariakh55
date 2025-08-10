const fs = require("fs");
const path = require("path");
const { uniqFilterAccordingToProp } = require("./functions");

/** @typedef {{
 * id: string,
 * title: string,
 * artists: string[],
 * album: string,
 * publishedYear: string,
 * }} Track */

/** @type Record<string, Track[]> */
const PLAYLIST_CACHE = {};
const PLAYLIST_JSON = path.resolve(process.cwd(), "playlist.json");
const BASE_API_URL = "https://musicbrainz.org/ws/2/";
const USER_AGENT =
  "Application sulfurwebsite/1.0.0 sulfursa@sulfursashimi.tech";

const fetchTrackInfo = async (mbid) => {
  const apiUrl = new URL(`release/${mbid}`, BASE_API_URL);
  const searchParams = apiUrl.searchParams;
  searchParams.append("inc", "artists+recordings+labels");
  searchParams.append("fmt", "json");

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch MusicBrainz api");
  }

  const musicbrainz = await response.json();
  const media = musicbrainz.media.flatMap((media) => media["tracks"]);
  const artist = musicbrainz["artist-credit"].name;
  const album = musicbrainz["title"];

  const tracks = media.map((track) => ({
    id: track.id,
    title: track.title,
    artist,
    album,
  }));

  PLAYLIST_CACHE[mbid] = tracks;
  return tracks;
};

const resolveTracks = async () => {
  const tracks = JSON.parse(fs.readFileSync(PLAYLIST_JSON));
  if (!Array.isArray(tracks)) return [];

  let resolvedTracks = [];
  const mbids = [];

  tracks.forEach((track) => {
    if (PLAYLIST_CACHE[track.mbid]) {
      const cached = PLAYLIST_CACHE[track.mbid];
      resolvedTracks.push(...cached);
      return;
    }

    mbids.push(track.mbid);
  });

  if (mbids.length > 0) {
    const tracks = await Promise.all(mbids.map((mbid) => fetchTrackInfo(mbid)));
    resolvedTracks = [...resolvedTracks, ...tracks.flat()];
  }

  return resolvedTracks.filter(uniqFilterAccordingToProp("id"));
};

module.exports = {
  resolveTracks,
};
