import {
  albumTitleVariants,
  calculateCloseEnoughScore,
  calculateFuzzyScore,
  stripEditionSuffix,
} from '../fuzzyUtils';

describe('stripEditionSuffix / albumTitleVariants', () => {
  it('strips parenthetical edition suffixes', () => {
    expect(stripEditionSuffix('Laughing So Hard, It Hurts (Laughing Edition)'))
      .toBe('Laughing So Hard, It Hurts');
    expect(albumTitleVariants('Laughing So Hard, It Hurts (Laughing Edition)')).toEqual([
      'laughing so hard, it hurts (laughing edition)',
      'laughing so hard, it hurts',
    ]);
  });

  it('strips deluxe / remaster style suffixes', () => {
    expect(stripEditionSuffix('Some Album (Deluxe Edition)')).toBe('Some Album');
    expect(stripEditionSuffix('Some Album - Deluxe')).toBe('Some Album');
  });
});

describe('calculateCloseEnoughScore', () => {
  it('matches Discogs edition title to Apple base title (MAVI example)', () => {
    const discogs = 'Laughing So Hard, It Hurts (Laughing Edition)';
    const apple = 'Laughing so Hard, It Hurts';
    expect(calculateFuzzyScore(discogs, apple)).toBeLessThan(0.9);
    expect(calculateCloseEnoughScore(discogs, apple)).toBeGreaterThanOrEqual(0.9);
  });

  it('matches when Apple omits a version suffix', () => {
    const discogs = 'Cool Album (Smiling Version)';
    const apple = 'Cool Album';
    expect(calculateCloseEnoughScore(discogs, apple)).toBeGreaterThanOrEqual(0.9);
  });

  it('scores artist subset credits as close enough', () => {
    const discogs = 'E L U C I D & Sebb Bash';
    const apple = 'E L U C I D';
    expect(calculateCloseEnoughScore(discogs, apple)).toBeGreaterThanOrEqual(0.7);
  });
});
