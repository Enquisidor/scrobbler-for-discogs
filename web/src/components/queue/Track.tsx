import React from 'react';
import type { DiscogsTrack, Settings, DiscogsArtist, CombinedMetadata, DiscogsRelease } from '../../libs';
import IndeterminateCheckbox from './IndeterminateCheckbox';
import { getTrackFeaturedArtists, getTrackCreditsStructured, isVariousArtist } from '../../libs';
import { getDisplayArtistName, getArtistJoiner } from '../../libs';

// Exported for use in QueueItem to allow polymorphic prop passing
export interface TrackPassthroughProps {
    selectedTrackKeys: Set<string>;
    selectedFeatures: Set<string>;
    artistSelections: Record<string, Set<string>>;
    scrobbleTimestamps: Record<string, number>;
    settings: Settings;
    metadata: CombinedMetadata | undefined;
    onToggle: (trackKey: string) => void;
    onFeatureToggle: (trackKey: string) => void;
    onArtistToggle: (trackKey: string, artistName: string) => void;
    onToggleParent: (parentIndex: number, subTrackKeys: string[]) => void;
    onSelectParentAsSingle: (parentKey: string, subTrackKeys: string[]) => void;
    isHistoryItem?: boolean;
}

export interface TrackProps extends TrackPassthroughProps {
    track: DiscogsTrack;
    release: DiscogsRelease; // Needed for helper
    parentIndex: number;
    groupHeading?: string;
    albumArtistName: string;
    useTrackArtist: boolean;
}

const Track: React.FC<TrackProps> = ({
    track,
    release,
    parentIndex,
    groupHeading,
    albumArtistName,
    useTrackArtist,
    ...passthroughProps
}) => {
    // Destructure the passthrough props needed locally
    const {
        selectedTrackKeys,
        selectedFeatures,
        artistSelections,
        scrobbleTimestamps,
        settings,
        metadata,
        onToggle,
        onFeatureToggle,
        onArtistToggle,
        onToggleParent,
        onSelectParentAsSingle,
        isHistoryItem,
    } = passthroughProps;

    const hasSubTracks = track.sub_tracks && track.sub_tracks.length > 0;
    const trackKey = String(parentIndex);

    let isChecked: boolean;
    let isIndeterminate: boolean;
    let subTrackKeys: string[] = [];

    const featuredArtists = getTrackFeaturedArtists(track);
    const structuredCredits = getTrackCreditsStructured(track);

    if (hasSubTracks) {
        // Defensive check: ensure sub_tracks exists before mapping
        subTrackKeys = track.sub_tracks?.map((_, sIndex) => `${parentIndex}-${sIndex}`) || [];
        const numSelectedSubtracks = subTrackKeys.filter(key => selectedTrackKeys.has(key)).length;

        const isParentSelectedAsSingleTrack = selectedTrackKeys.has(trackKey) && numSelectedSubtracks === 0;
        const allSubtracksSelected = subTrackKeys.length > 0 && numSelectedSubtracks === subTrackKeys.length;
        const someSubtracksSelected = numSelectedSubtracks > 0 && !allSubtracksSelected;

        isChecked = allSubtracksSelected;
        isIndeterminate = someSubtracksSelected || isParentSelectedAsSingleTrack;
    } else {
        isChecked = selectedTrackKeys.has(trackKey);
        isIndeterminate = false;
    }

    const scrubbedPosition = (pos: string) => {
        if (!pos) return '';
        if (!groupHeading) return pos;
        const prefix = pos.match(/^([A-Z]+|^\d+-)/);
        if (prefix && groupHeading.startsWith(prefix[1].replace('-', ''))) {
            return pos.substring(prefix[1].length);
        }
        return pos;
    };

    const renderDuration = (key: string, duration: string) => {
        const timestamp = scrobbleTimestamps[key];
        const isSelected = selectedTrackKeys.has(key);

        if (!isHistoryItem && isSelected && timestamp !== undefined) {
            return (
                <span className="text-sm text-[#228B22] font-semibold w-12 text-right flex-shrink-0" title={`Scrobbles at ${new Date(timestamp * 1000).toLocaleString()}`}>
                    {duration}
                </span>
            );
        }
        return <span className="text-sm text-gray-500 w-12 text-right flex-shrink-0">{duration || '--:--'}</span>;
    };

    const renderArtistList = (currentKey: string, artists: DiscogsArtist[] | undefined) => {
        if (!artists || artists.length === 0) return null;

        const selectedSet = artistSelections[currentKey] || new Set();

        return (
            <span className="ml-2 text-sm text-gray-400 truncate">
                by
                {artists.map((artist, index) => {
                    const displayName = getDisplayArtistName(artist.name);
                    const isSelected = selectedSet.has(displayName);
                    const joiner = index > 0 ? getArtistJoiner(artists[index - 1].join) : '';

                    return (
                        <React.Fragment key={index}>
                            {joiner}
                            {!isHistoryItem ? (
                                <label className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-200" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onArtistToggle(currentKey, displayName)}
                                        className="form-checkbox h-3 w-3 rounded-sm bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span>{displayName}</span>
                                </label>
                            ) : (
                                <span>{displayName}</span>
                            )}
                        </React.Fragment>
                    );
                })}
            </span>
        );
    };

    const renderCredits = (currentKey: string, credits: { role: string; artists: DiscogsArtist[] }[]) => {
        if (!credits || credits.length === 0) return null;
        const selectedSet = artistSelections[currentKey] || new Set();

        return (
            <div className="text-xs text-gray-500 mt-1 max-h-[80px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {credits.map((credit, cIndex) => (
                    <div key={cIndex} className="flex flex-wrap gap-1 items-baseline mb-1">
                        <span className="font-semibold whitespace-nowrap mr-1">{credit.role}:</span>
                        {credit.artists.map((artist, aIndex) => {
                            const displayName = getDisplayArtistName(artist.name);
                            const joiner = aIndex > 0 ? getArtistJoiner(credit.artists[aIndex - 1].join) : '';

                            return (
                                <React.Fragment key={aIndex}>
                                    {joiner}
                                    {<span>{displayName}</span>}
                                </React.Fragment>
                            )
                        })}
                        {cIndex < credits.length - 1 && <span className="mr-2">; </span>}
                    </div>
                ))}
            </div>
        );
    }


    return (
        <div key={parentIndex}>
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/50">
                {!isHistoryItem ? (
                    <IndeterminateCheckbox
                        checked={isChecked}
                        indeterminate={isIndeterminate}
                        onChange={hasSubTracks ? () => onToggleParent(parentIndex, subTrackKeys) : () => onToggle(trackKey)}
                        title={hasSubTracks ? "Select/Deselect all subtracks" : ""}
                        className="form-checkbox h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800 flex-shrink-0"
                    />
                ) : (
                    <div className="w-5 h-5 flex-shrink-0" />
                )}

                <span className="text-sm text-gray-400 font-mono w-10 text-right flex-shrink-0">{scrubbedPosition(track.position)}</span>

                <div className="flex-grow flex flex-col min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-2 min-w-0">
                        <div className="flex flex-wrap items-baseline min-w-0">
                            <span className="font-semibold truncate mr-1" title={track.title}>{track.title}</span>

                            {/* Main Artist Display */}
                            {(!hasSubTracks && (isVariousArtist(albumArtistName) || (track.artists && track.artists.length > 0))) &&
                                renderArtistList(trackKey, track.artists)
                            }
                        </div>

                        <div className="flex items-center gap-2">
                            {!isHistoryItem && settings.showFeatures && featuredArtists && !hasSubTracks && (
                                <label className="text-xs italic text-gray-500 flex-shrink-0 flex items-center gap-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedFeatures.has(trackKey)}
                                        onChange={() => onFeatureToggle(trackKey)}
                                        className="form-checkbox h-3 w-3 rounded-sm bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                                        title={`Include featured artists in scrobble`}
                                    />
                                    {featuredArtists}
                                </label>
                            )}
                            {!isHistoryItem && hasSubTracks && (
                                <span
                                    className="text-xs italic text-blue-400 hover:text-blue-300 cursor-pointer flex-shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectParentAsSingle(trackKey, subTrackKeys);
                                    }}
                                >
                                    (Scrobble as 1 track)
                                </span>
                            )}
                        </div>
                    </div>

                    {!hasSubTracks && renderCredits(trackKey, structuredCredits)}

                </div>
                {renderDuration(trackKey, track.duration)}
            </div>

            {hasSubTracks && (
                <div className="ml-8 space-y-1 mt-1 pl-4 border-l-2 border-gray-700">
                    {track.sub_tracks?.map((subTrack, sIndex) => {
                        const subTrackKey = `${parentIndex}-${sIndex}`;
                        const subFeaturedArtists = getTrackFeaturedArtists(subTrack);
                        const subStructuredCredits = getTrackCreditsStructured(subTrack);

                        return (
                            <div key={sIndex} className={`flex items-center gap-3 p-2 rounded-md ${!isHistoryItem ? 'hover:bg-gray-700/50' : ''}`}>
                                {!isHistoryItem ? (
                                    <label className="flex items-center gap-3 cursor-pointer flex-grow">
                                        <input
                                            type="checkbox"
                                            checked={selectedTrackKeys.has(subTrackKey)}
                                            onChange={() => onToggle(subTrackKey)}
                                            className="form-checkbox h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800 flex-shrink-0"
                                        />
                                        <span className="text-sm text-gray-400 font-mono w-10 text-right flex-shrink-0">{scrubbedPosition(subTrack.position)}</span>
                                    </label>
                                ) : (
                                    <>
                                        <div className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm text-gray-400 font-mono w-10 text-right flex-shrink-0">{scrubbedPosition(subTrack.position)}</span>
                                    </>
                                )}
                                <div className="flex-grow flex flex-col min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-2 min-w-0">
                                        <div className="flex flex-wrap items-baseline min-w-0">
                                            <span className="truncate mr-1" title={subTrack.title}>{subTrack.title}</span>
                                            {(isVariousArtist(albumArtistName) || (subTrack.artists && subTrack.artists.length > 0)) &&
                                                renderArtistList(subTrackKey, subTrack.artists)
                                            }
                                        </div>
                                        {!isHistoryItem && settings.showFeatures && subFeaturedArtists && (
                                            <label className="text-xs italic text-gray-500 flex-shrink-0 flex items-center gap-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFeatures.has(subTrackKey)}
                                                    onChange={() => onFeatureToggle(subTrackKey)}
                                                    className="form-checkbox h-3 w-3 rounded-sm bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                                                    title={`Include featured artists in scrobble`}
                                                />
                                                {subFeaturedArtists}
                                            </label>
                                        )}
                                    </div>
                                    {renderCredits(subTrackKey, subStructuredCredits)}
                                </div>
                                {renderDuration(subTrackKey, subTrack.duration)}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default Track;
