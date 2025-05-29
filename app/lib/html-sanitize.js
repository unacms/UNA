import { Platform } from 'react-native';

export function removeEmptySpans(html) {
  if (!html || typeof html !== 'string') return html;

  // Web: Use DOMParser
  if (typeof window !== 'undefined' && window.DOMParser) {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    // Remove empty spans
    const spans = doc.querySelectorAll('span');
    spans.forEach(span => {
      let text = span.textContent
        .replace(/\u00A0/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
      if (text === '') {
        span.parentNode.removeChild(span);
      }
    });
    // Clean up <br> inside <p>
    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach(p => {
      // Remove leading/trailing <br>
      while (p.firstChild && p.firstChild.tagName === 'BR') p.removeChild(p.firstChild);
      while (p.lastChild && p.lastChild.tagName === 'BR') p.removeChild(p.lastChild);
      // Replace multiple <br> with a single <br>
      let html = p.innerHTML;
      html = html.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>');
      p.innerHTML = html;
    });
    return doc.body.firstChild.innerHTML;
  }

  // React Native/Node: Use aggressive regex-based sanitizer
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    // Remove empty spans (including those with only whitespace, newlines, <br>, &nbsp;, zero-width, or unicode non-breaking spaces)
    html = html.replace(/<span[^>]*>(?:\s|&nbsp;|<br\s*\/?>|\u00A0|[\u200B-\u200D\uFEFF])*<\/span>/gi, '');
    // Remove leading <br> and similar inside <p>
    html = html.replace(/<p>((?:\s|<br\s*\/?>|&nbsp;|\u00A0|[\u200B-\u200D\uFEFF])*)/gi, '<p>');
    // Remove trailing <br> and similar inside <p>
    html = html.replace(/((?:\s|<br\s*\/?>|&nbsp;|\u00A0|[\u200B-\u200D\uFEFF])*)<\/p>/gi, '</p>');
    // Replace multiple <br> with a single <br>
    html = html.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>');
    return html;
  }

  // Fallback: return original
  return html;
} 