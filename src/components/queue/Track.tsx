
import React from 'react';
import type { EnrichedTrack, Settings } from '../../types';
import IndeterminateCheckbox from './IndeterminateCheckbox';

interface TrackProps {
    track: EnrichedTrack;
    parentIndex: number;
    groupHeading?: string;
    albumArtistName: string;
    selectedTrackKeys: Set<string>;
    selectedFeatures: Set<string>;
    scrobbleTimestamps: Record<string, number>;
    settings: Settings;
    onToggle: (trackKey: string) => void;
    onFeatureToggle: (trackKey: string) => void;
    onToggleParent: (parentIndex: number, subTrackKeys: string[]) => void;
    onSelectParentAsSingle: (parentKey: string, subTrackKeys: string[]) => void;
}

const Track: React.FC<TrackProps> = ({
    track,
    parentIndex,
    groupHeading,
    albumArtistName,
    selectedTrackKeys,
    selectedFeatures,
    scrobbleTimestamps,
    settings,
    onToggle,
    onFeatureToggle,
    onToggleParent,
    onSelectParentAsSingle,
}) => {
    const hasSubTracks = track.sub_tracks && track.sub_tracks.length > 0;
    const trackKey = String(parentIndex);
    
    let isChecked: boolean;
    let isIndeterminate: boolean;
    let subTrackKeys: string[] = [];

    if (hasSubTracks) {
        subTrackKeys = track.sub_tracks!.map((_, sIndex) => `${parentIndex}-${sIndex}`);
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
        if (prefix && groupHeading.startsWith(prefix[1].replace('-',''))) {
            return pos.substring(prefix[1].length);
        }
        return pos;
    };

    const renderDuration = (trackKey: string, duration: string) => {
        const timestamp = scrobbleTimestamps[trackKey];
        const isSelected = selectedTrackKeys.has(trackKey);

        if (isSelected && timestamp !== undefined) {
            return (
                <span className="text-sm text-red-400 font-semibold w-12 text-right flex-shrink-0" title={`Scrobbles at ${new Date(timestamp * 1000).toLocaleString()}`}>
                    {duration}
                </span>
            );
        }
        return <span className="text-sm text-red-400 w-12 text-right flex-shrink-0">{duration}</span>;
    };


    return (
        <div key={parentIndex}>
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/50">
                <IndeterminateCheckbox
                    checked={isChecked}
                    indeterminate={isIndeterminate}
                    onChange={hasSubTracks ? () => onToggleParent(parentIndex, subTrackKeys) : () => onToggle(trackKey)}
                    title={hasSubTracks ? "Select/Deselect all subtracks" : ""}
                    className="form-checkbox h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800 flex-shrink-0"
                />
                <span className="text-sm text-gray-400 font-mono w-10 text-right flex-shrink-0">{scrubbedPosition(track.position)}</span>
                <div className="flex-grow flex flex-col sm:flex-row sm:items-baseline gap-x-2 min-w-0">
                    <div className="flex items-baseline min-w-0">
                        <span className="font-semibold truncate" title={track.title}>{track.title}</span>
                         {albumArtistName.toLowerCase() === 'various' && !hasSubTracks && (
                            <span className="text-sm text-gray-400 truncate ml-2" title={track.display_artist}> - {track.display_artist}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {settings.showFeatures && track.featured_artists && !hasSubTracks && (
                            <label className="text-xs italic text-gray-500 flex-shrink-0 flex items-center gap-1 cursor-pointer" onClick={e=>e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selectedFeatures.has(trackKey)}
                                    onChange={() => onFeatureToggle(trackKey)}
                                    className="form-checkbox h-3 w-3 rounded-sm bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                                    title={`Include featured artists in scrobble`}
                                />
                                {track.featured_artists}
                            </label>
                        )}
                        {hasSubTracks && (
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
                {renderDuration(trackKey, track.duration)}
            </div>
            
            {hasSubTracks && (
                <div className="ml-8 space-y-1 mt-1 pl-4 border-l-2 border-gray-700">
                    {track.sub_tracks!.map((subTrack, sIndex) => {
                        const subTrackKey = `${parentIndex}-${sIndex}`;
                        return (
                        <label key={sIndex} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedTrackKeys.has(subTrackKey)}
                                onChange={() => onToggle(subTrackKey)}
                                className="form-checkbox h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800 flex-shrink-0"
                            />
                             <span className="text-sm text-gray-400 font-mono w-10 text-right flex-shrink-0">{scrubbedPosition(subTrack.position)}</span>
                            <div className="flex-grow flex flex-col sm:flex-row sm:items-baseline gap-x-2 min-w-0">
                                <div className="flex items-baseline min-w-0">
                                    <span className="truncate" title={subTrack.title}>{subTrack.title}</span>
                                    {albumArtistName.toLowerCase() === 'various' && (
                                        <span className="text-sm text-gray-400 truncate ml-2" title={subTrack.display_artist}> - {subTrack.display_artist}</span>
                                    )}
                                </div>
                                {settings.showFeatures && subTrack.featured_artists && (
                                <label className="text-xs italic text-gray-500 flex-shrink-0 flex items-center gap-1 cursor-pointer" onClick={e=>e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedFeatures.has(subTrackKey)}
                                        onChange={() => onFeatureToggle(subTrackKey)}
                                        className="form-checkbox h-3 w-3 rounded-sm bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                                        title={`Include featured artists in scrobble`}
                                    />
                                    {subTrack.featured_artists}
                                </label>
                            )}
                            </div>
                            {renderDuration(subTrackKey, subTrack.duration)}
                        </label>
                    )})}
                </div>
            )}
        </div>
    );
};

export default Track;