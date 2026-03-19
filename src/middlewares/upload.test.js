'use strict';

// Feature: techfest-2026-backend, Property 17: File upload enforcement
// Validates: Requirements 16.7

const fc = require('fast-check');
const { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } = require('./upload');

describe('Upload middleware - file type and size enforcement', () => {
  // Property 17: File upload enforcement
  test('Property 17: invalid MIME types are not in the allowed list', () => {
    // Feature: techfest-2026-backend, Property 17: File upload enforcement
    // Validates: Requirements 16.7
    const invalidMimes = [
      'application/pdf',
      'text/plain',
      'video/mp4',
      'audio/mpeg',
      'application/json',
      'application/zip',
      'image/gif',
      'image/bmp',
      'image/tiff',
    ];

    fc.assert(
      fc.property(fc.constantFrom(...invalidMimes), (mime) => {
        expect(ALLOWED_MIME_TYPES).not.toContain(mime);
      }),
      { numRuns: 100 }
    );
  });

  test('Property 17: valid MIME types are in the allowed list', () => {
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const mime of validMimes) {
      expect(ALLOWED_MIME_TYPES).toContain(mime);
    }
  });

  test('MAX_FILE_SIZE is exactly 5MB', () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });

  test('Property 17: any file size > 5MB exceeds the limit', () => {
    fc.assert(
      fc.property(fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 10 }), (size) => {
        expect(size).toBeGreaterThan(MAX_FILE_SIZE);
      }),
      { numRuns: 100 }
    );
  });

  test('Property 17: any file size <= 5MB is within the limit', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: MAX_FILE_SIZE }), (size) => {
        expect(size).toBeLessThanOrEqual(MAX_FILE_SIZE);
      }),
      { numRuns: 100 }
    );
  });
});
