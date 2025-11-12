const fs = require("fs");
const path = require("path");
const { uniqFilterAccordingToProp } = require("./functions");

/** @typedef {{
 * id: string;
 * title: string;
 * artists: string[];
 * album: string;
 * publishedYear: string;
 * mbid: string;
 * coverArt?: string;
 * link?: string;
 * }} Track */

/** @type Record<string, Track[]> */
const PLAYLIST_CACHE = {};
const PLAYLIST_JSON = path.resolve(process.cwd(), "playlist.json");

const MUSICBRAINZ = "musicbrainz.org";
const BASE_API_URL = `https://beta.${MUSICBRAINZ}/ws/2/`;
const BASE_COVERART_API_URL = "https://coverartarchive.org/";

const USER_AGENT =
  "Application sulfurwebsite/1.0.0 sulfursa@sulfursashimi.tech";

const populateWithCoverArt = async (tracks, coverArt) => {
  return tracks.map((track) => ({ ...track, coverArt }));
};

const fetchTrackCoverArt = async (mbid) => {
  const tracks = PLAYLIST_CACHE[mbid];
  if (tracks && tracks.length > 0 && tracks[0].coverArt)
    return tracks[0].coverArt;

  const apiUrl = new URL(`release/${mbid}/front-500`, BASE_COVERART_API_URL);

  let httpResponse = null;
  try {
    httpResponse = await fetch(apiUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
      },
    });
  } catch {
    console.warn("something bad happend");
  }

  if (!httpResponse.ok) {
    console.error("Failed to fetch MusicBrainz api");
    return null;
  }

  const coverArtBlob = await httpResponse.blob();
  const arrayBuffer = await coverArtBlob.arrayBuffer();
  const base64CoverArt = Buffer.from(arrayBuffer).toString("base64");

  const coverArt = `data:image/jpg;base64,${base64CoverArt}`;
  if (tracks && tracks.length > 0) populateWithCoverArt(tracks, coverArt);

  return coverArt;
};

const fetchTrackInfo = async (mbid, titles = []) => {
  const apiUrl = new URL(`release/${mbid}`, BASE_API_URL);

  const searchParams = apiUrl.searchParams;
  searchParams.append("inc", "artists+recordings+labels+media");
  searchParams.append("fmt", "json");

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch MusicBrainz api", await response.text());
    return [];
  }

  const musicbrainz = await response.json();
  const media = musicbrainz.media.flatMap((media) => media["tracks"]);
  const artist = musicbrainz["artist-credit"][0].name;
  const album = musicbrainz["title"];

  const tracks = media.map((track) => ({
    id: track.recording.id,
    link: `https://${MUSICBRAINZ}/track/${track.id}`,
    title: track.title,
    artist,
    album,
    mbid,
  }));

  PLAYLIST_CACHE[mbid] = tracks;

  return titles.length > 0
    ? tracks.filter((track) => titles.includes(track.title))
    : tracks;
};

const resolveTracks = async () => {
  const tracks = JSON.parse(fs.readFileSync(PLAYLIST_JSON));
  if (!Array.isArray(tracks)) return [];

  let resolvedTracks = [];
  const idToTitles = {};
  const mbids = [];

  tracks.forEach((track) => {
    if (PLAYLIST_CACHE[track.mbid]) {
      let cached = PLAYLIST_CACHE[track.mbid];
      if (track.titles && track.titles.length > 0) {
        cached = cached.filter((item) => track.titles.includes(item.title));
      }
      resolvedTracks.push(...cached);
      return;
    }

    idToTitles[track.mbid] = track.titles;
    mbids.push(track.mbid);
  });

  if (mbids.length > 0) {
    const tracks = await Promise.all(
      mbids.map((mbid) => fetchTrackInfo(mbid, idToTitles[mbid])),
    );
    resolvedTracks = [...resolvedTracks, ...tracks.flat()];
  }

  const cacheInfo = Object.keys(PLAYLIST_CACHE).length;
  console.log(cacheInfo);
  return {
    playlist: resolvedTracks.filter(uniqFilterAccordingToProp("id")),
    cacheInfo,
  };
};

module.exports = {
  resolveTracks,
  fetchTrackCoverArt,
};
