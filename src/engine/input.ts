type KeyCode =
| "Escape"
| "Digit1"
| "Digit2"
| "Digit3"
| "Digit4"
| "Digit5"
| "Digit6"
| "Digit7"
| "Digit8"
| "Digit9"
| "Digit0"
| "Minus"
| "Equal"
| "Backspace"
| "Tab"
| "KeyQ"
| "KeyW"
| "KeyE"
| "KeyR"
| "KeyT"
| "KeyY"
| "KeyU"
| "KeyI"
| "KeyO"
| "KeyP"
| "BracketLeft"
| "BracketRight"
| "Enter"
| "ControlLeft"
| "KeyA"
| "KeyS"
| "KeyD"
| "KeyF"
| "KeyG"
| "KeyH"
| "KeyJ"
| "KeyK"
| "KeyL"
| "Semicolon"
| "Quote"
| "Backquote"
| "ShiftLeft"
| "Backslash"
| "KeyZ"
| "KeyX"
| "KeyC"
| "KeyV"
| "KeyB"
| "KeyN"
| "KeyM"
| "Comma"
| "Period"
| "Slash"
| "ShiftRight"
| "NumpadMultiply"
| "AltLeft"
| "Space"
| "CapsLock"
| "F1"
| "F2"
| "F3"
| "F4"
| "F5"
| "F6"
| "F7"
| "F8"
| "F9"
| "F10"
| "Pause"
| "ScrollLock"
| "Numpad7"
| "Numpad8"
| "Numpad9"
| "NumpadSubtract"
| "Numpad4"
| "Numpad5"
| "Numpad6"
| "NumpadAdd"
| "Numpad1"
| "Numpad2"
| "Numpad3"
| "Numpad0"
| "NumpadDecimal"
| "IntlBackslash"
| "F11"
| "F12"
| "NumpadEqual"
| "MediaTrackNext"
| "NumpadEnter"
| "ControlRight"
| "NumpadDivide"
| "PrintScreen"
| "AltRight"
| "NumLock"
| "Home"
| "ArrowUp"
| "PageUp"
| "ArrowLeft"
| "ArrowRight"
| "End"
| "ArrowDown"
| "PageDown"
| "Insert"
| "Delete"

export default class Input {
  private prev: Set<string> = new Set();
  private current: Set<string> = new Set();
  private held: Set<string> = new Set();

  private stopper: () => void = () => {};

  private isRunning = false;

  constructor() {
    this.start();
  }

  update() {
    this.prev.clear();
    for (const b of this.current) this.prev.add(b);
    this.current.clear();
    for (const b of this.held) this.current.add(b);
  }

  isPressed(key: KeyCode) {
    return this.current.has(key) && !this.prev.has(key);
  }

  isHeld(key: KeyCode) {
    return this.current.has(key) && this.prev.has(key);
  }

  isReleased(key: KeyCode) {
    return !this.current.has(key) && this.prev.has(key);
  }

  start() {
    const keydownHandler = (e: KeyboardEvent) => {
      this.held.add(e.code);
    };
    const keyupHandler = (e: KeyboardEvent) => {
      this.held.delete(e.code);
    };
    this.isRunning = true;
    addEventListener('keydown', keydownHandler);
    addEventListener('keyup', keyupHandler);
    this.stopper = () => {
      this.isRunning = false;
      removeEventListener('keydown', keydownHandler);
      removeEventListener('keyup', keyupHandler);
    };
  }

  stop() {
    this.stopper();
  }

  isStopped() {return !this.isRunning;}
}