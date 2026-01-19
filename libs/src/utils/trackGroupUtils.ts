/**
 * Track grouping utilities for organizing tracklists by disc/side
 * Groups tracks by heading (e.g., "Side A", "Disc 1") or by position prefix
 */

import _ from 'lodash';
import type { DiscogsTrack } from '../types';

export interface TrackGroup {
  heading: string;
  tracks: { track: DiscogsTrack; originalIndex: number }[];
}

type TrackWithIndex = { track: DiscogsTrack; originalIndex: number };
type RawGroup = { heading: string; tracksWithIndices: TrackWithIndex[] };

const getPrefix = (track: DiscogsTrack): string => {
  if (track.position) {
    const match = track.position.match(/^([A-Z]+|^\d+-)/);
    if (match) return match[1].replace('-', '');
  }
  return _.chain(track.sub_tracks).map(getPrefix).find(Boolean).value() || '';
};

/**
 * Assigns tracks to groups based on headings or position prefixes.
 * Handles vinyl sides (A1, A2, B1...), multi-disc releases (1-01, 2-01...),
 * and explicit heading tracks.
 */
export const assignGroups = (tracklist: DiscogsTrack[] | null): TrackGroup[] => {
  if (!tracklist) return [];

  type Acc = { groups: RawGroup[]; currentGroup: RawGroup | null };

  const { groups, currentGroup } = _.reduce<DiscogsTrack, Acc>(
    tracklist,
    (acc, track, index) => {
      if (track.type_ === 'heading') {
        const newGroup: RawGroup = { heading: track.title, tracksWithIndices: [] };
        return acc.currentGroup && acc.currentGroup.tracksWithIndices.length > 0
          ? { groups: [...acc.groups, acc.currentGroup], currentGroup: newGroup }
          : { groups: acc.groups, currentGroup: newGroup };
      }
      const group = acc.currentGroup || { heading: '', tracksWithIndices: [] };
      return {
        groups: acc.groups,
        currentGroup: {
          ...group,
          tracksWithIndices: [...group.tracksWithIndices, { track, originalIndex: index }],
        },
      };
    },
    { groups: [], currentGroup: null }
  );

  const rawGroups = currentGroup && currentGroup.tracksWithIndices.length > 0
    ? [...groups, currentGroup]
    : groups;

  return _.flatMap(rawGroups, (rawGroup: RawGroup) => {
    if (rawGroup.heading) {
      return [{ heading: rawGroup.heading, tracks: rawGroup.tracksWithIndices }];
    }

    const positionGroups = _.groupBy(rawGroup.tracksWithIndices, ({ track }) => getPrefix(track));
    const entries = Object.entries(positionGroups);

    if (entries.length > 1) {
      return _.map(entries, ([heading, tracks]) => ({
        heading: heading || 'Tracks',
        tracks,
      }));
    }

    return [{ heading: '', tracks: rawGroup.tracksWithIndices }];
  });
};
