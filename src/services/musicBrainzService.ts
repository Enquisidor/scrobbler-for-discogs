const API_BASE = 'https://musicbrainz.org/ws/2/';

// MusicBrainz API requires a rate limit of 1 request per second.
// See: https://musicbrainz.org/doc/XML_Web_Service/Rate_Limiting
let lastRequestTime = 0;
const requestInterval = 1100; // 1.1 seconds to be safe

async function musicbrainzFetch(endpoint: string) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < requestInterval) {
        await new Promise(resolve => setTimeout(resolve, requestInterval - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            // MusicBrainz API requires a User-Agent header.
            'User-Agent': 'VinylScrobbler/1.0 ( https://github.com/google/labs-prototypes )'
        }
    });

    if (!response.ok) {
        // Don't throw, just log and return null to avoid breaking the app if MusicBrainz is down.
        console.error(`MusicBrainz API Error: ${response.statusText} (Status: ${response.status})`);
        return null;
    }
    return response.json();
}

/**
 * Fetches the official artist name for a given release from MusicBrainz.
 * @param albumTitle The title of the album.
 * @param artistName The artist name according to Discogs.
 * @returns The official artist name string, or null if not found or an error occurs.
 */
export const fetchOfficialArtistName = async (albumTitle: string, artistName: string): Promise<string | null> => {
    if (!albumTitle || !artistName || artistName === 'Various') return null;
    
    try {
        // MusicBrainz search syntax: https://musicbrainz.org/doc/Search_Syntax
        const query = `release:"${albumTitle}" AND artist:"${artistName}"`;
        const endpoint = `release?query=${encodeURIComponent(query)}&limit=1&fmt=json`;
        
        const data = await musicbrainzFetch(endpoint);

        if (data && data.releases && data.releases.length > 0) {
            const release = data.releases[0];
            if (release['artist-credit'] && release['artist-credit'].length > 0) {
                // Join artist names and their join phrases (e.g., "Artist 1" + " & " + "Artist 2")
                return release['artist-credit'].map((credit: any) => credit.name + (credit.joinphrase || '')).join('').trim();
            }
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch from MusicBrainz:', error);
        return null; // Return null on error to not block the user experience.
    }
};
