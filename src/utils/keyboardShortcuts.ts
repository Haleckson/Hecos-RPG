/**
 * Global Keyboard Formatting Shortcuts Helper for Text Inputs and Textareas
 * Supports Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline), Ctrl+K (Codex Link), etc.
 */

export function setupGlobalTextFormattingShortcuts(): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only trigger if Ctrl (or Cmd on Mac) is pressed and not with Alt
    if (!(e.ctrlKey || e.metaKey) || e.altKey) {
      return;
    }

    const key = e.key.toLowerCase();
    let prefix = '';
    let suffix = '';

    if (key === 'b') {
      prefix = '**';
      suffix = '**';
    } else if (key === 'i') {
      prefix = '*';
      suffix = '*';
    } else if (key === 'u') {
      prefix = '<u>';
      suffix = '</u>';
    } else if (key === 'k') {
      prefix = '[[';
      suffix = ']]';
    } else {
      return;
    }

    const activeEl = document.activeElement;
    if (
      !activeEl ||
      !(
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLInputElement &&
          ['text', 'search', 'url', ''].includes(activeEl.type))
      )
    ) {
      return;
    }

    // Prevent default browser shortcut (e.g., Ctrl+B bookmark, Ctrl+U view source, Ctrl+K address bar focus)
    e.preventDefault();
    e.stopPropagation();

    applyFormattingToInput(activeEl, prefix, suffix);
  };

  window.addEventListener('keydown', handleKeyDown, true);
  return () => {
    window.removeEventListener('keydown', handleKeyDown, true);
  };
}

export function applyFormattingToInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  prefix: string,
  suffix: string
) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const val = el.value || '';
  const selected = val.substring(start, end);

  let newVal = '';
  let newStart = start;
  let newEnd = end;

  // Check if selected text is already wrapped with prefix and suffix -> toggle off
  if (
    selected.startsWith(prefix) &&
    selected.endsWith(suffix) &&
    selected.length >= prefix.length + suffix.length
  ) {
    const unwrapped = selected.slice(prefix.length, selected.length - suffix.length);
    newVal = val.substring(0, start) + unwrapped + val.substring(end);
    newStart = start;
    newEnd = start + unwrapped.length;
  } else if (start !== end) {
    // Wrap selection
    newVal = val.substring(0, start) + prefix + selected + suffix + val.substring(end);
    newStart = start;
    newEnd = start + prefix.length + selected.length + suffix.length;
  } else {
    // No selection -> insert empty wrapper and put cursor inside
    const placeholder = '';
    newVal = val.substring(0, start) + prefix + placeholder + suffix + val.substring(end);
    newStart = start + prefix.length;
    newEnd = newStart;
  }

  // Trigger React synthetic event through prototype setter
  const prototype =
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (nativeValueSetter) {
    nativeValueSetter.call(el, newVal);
  } else {
    el.value = newVal;
  }

  // Dispatch both 'input' and 'change' events so React state synchronizes
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));

  setTimeout(() => {
    el.focus();
    el.setSelectionRange(newStart, newEnd);
  }, 0);
}
