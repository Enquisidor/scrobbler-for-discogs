
export interface DeezerAlbumResult {
    id: number;
    title: string;
    nb_tracks: number;
    record_type: string; // 'album' | 'ep' | 'single'
    explicit_lyrics: boolean;
    artist: {
        id: number;
        name: string;
    };
}

export interface DeezerSearchResponse {
    data: DeezerAlbumResult[];
    total: number;
}

const REQUEST_TIMEOUT_MS = 10000;

export const fetchFromDeezer = async (
    query: string,
    signal: AbortSignal | undefined
): Promise<DeezerSearchResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const onParentAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onParentAbort);

    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api.deezer.com/search/album?q=${encodedQuery}&output=json`;

        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            throw new Error(`Deezer API responded with status ${response.status}`);
        }

        return await response.json() as DeezerSearchResponse;
    } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
            if (signal?.aborted) {
                throw new DOMException('Aborted by parent', 'AbortError');
            }
            console.warn(`[Deezer API] Request timed out for query: "${query}"`);
        }
        throw e;
    } finally {
        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener('abort', onParentAbort);
    }
};
