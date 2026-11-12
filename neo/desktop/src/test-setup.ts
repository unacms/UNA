/**
 * What every test file gets (vite.config.ts `test.setupFiles`): jsdom has no layout, and the
 * rich editor (ProseMirror) asks for rectangles when it scrolls the caret into view.
 */
import { configure } from '@testing-library/react';

// findBy and waitFor give up after a second by default, which a loaded machine or a CI runner
// can take to draw a dialog; a test that passes never waits this long. vite.config.ts gives each
// test the time for a few such waits.
configure({ asyncUtilTimeout: 4000 });

const rect = () => ({ x: 0, y: 0, top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, toJSON: () => ({}) }) as DOMRect;
if (typeof Range !== 'undefined') {
    Range.prototype.getBoundingClientRect = rect;
    Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList;
}
if (typeof document !== 'undefined' && !document.elementFromPoint) document.elementFromPoint = () => null;
