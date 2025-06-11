import { is360Image, isVideo, isImage } from '../mediaUtils';

describe('mediaUtils helpers', () => {
  describe('is360Image', () => {
    it('detects names containing 360', () => {
      const file = { name: 'myphoto_360.jpg' };
      expect(is360Image(file)).toBe(true);
    });

    it('detects names containing pano (case-insensitive)', () => {
      const file = { name: 'Vacation-PANO.PNG' };
      expect(is360Image(file)).toBe(true);
    });

    it('returns false for non matching names', () => {
      const file = { name: 'regular.jpg' };
      expect(is360Image(file)).toBe(false);
    });

    it('handles missing input gracefully', () => {
      expect(is360Image()).toBe(false);
      expect(is360Image(null)).toBe(false);
      expect(is360Image({})).toBe(false);
    });
  });

  describe('isVideo', () => {
    it('returns true for video mime types', () => {
      expect(isVideo({ type: 'video/mp4' })).toBe(true);
    });

    it('returns false for non video mime types', () => {
      expect(isVideo({ type: 'image/png' })).toBe(false);
    });

    it('handles missing input gracefully', () => {
      expect(isVideo()).toBe(false);
      expect(isVideo({})).toBe(false);
    });
  });

  describe('isImage', () => {
    it('returns true for image mime types', () => {
      expect(isImage({ type: 'image/jpeg' })).toBe(true);
      expect(isImage({ type: 'image/png' })).toBe(true);
    });

    it('returns false for non image mime types', () => {
      expect(isImage({ type: 'video/webm' })).toBe(false);
    });

    it('handles missing input gracefully', () => {
      expect(isImage()).toBe(false);
      expect(isImage({})).toBe(false);
    });
  });
});
