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

type MouseButton =
| "MouseMain"
| "MouseAuxiliary"
| "MouseSecondary"

export default class Input {
  private prev: Set<string> = new Set();
  private current: Set<string> = new Set();
  private held: Set<string> = new Set();

  private nextWheel?: WheelEvent;
  private wheel?: WheelEvent;

  private stopper: () => void = () => {};

  private isRunning = false;

  private mouseTarget?: HTMLElement;

  constructor(mouseTarget?: HTMLElement) {
    this.mouseTarget = mouseTarget;
    if (this.mouseTarget) {
      this.mouseTarget.addEventListener('contextmenu', e => e.preventDefault());
    }
    this.start();
  }

  update() {
    this.prev.clear();
    for (const b of this.current) this.prev.add(b);
    this.current.clear();
    for (const b of this.held) this.current.add(b);
    this.wheel = this.nextWheel;
    this.nextWheel = undefined;
  }

  getWheel() {
    return this.wheel;
  }

  isPressed(button: KeyCode | MouseButton) {
    return this.current.has(button) && !this.prev.has(button);
  }

  isHeld(button: KeyCode | MouseButton) {
    return this.current.has(button) && this.prev.has(button);
  }

  isReleased(button: KeyCode | MouseButton) {
    return !this.current.has(button) && this.prev.has(button);
  }

  start() {
    this.isRunning = true;

    const wheelHandler = (e: WheelEvent) => this.nextWheel = e;
    const mousedownHandler = (e: MouseEvent) => {
      const button: MouseButton =
        e.button === 1
        ? "MouseAuxiliary"
        : e.button === 2
        ? "MouseSecondary"
        : "MouseMain";
      this.held.add(button);
    }
    const mouseupHandler = (e: MouseEvent) => {
      const button: MouseButton =
        e.button === 1
        ? "MouseAuxiliary"
        : e.button === 2
        ? "MouseSecondary"
        : "MouseMain";
      this.held.delete(button);
    }
    const keydownHandler = (e: KeyboardEvent) => {
      this.held.add(e.code);
    };
    const keyupHandler = (e: KeyboardEvent) => {
      this.held.delete(e.code);
    };

    addEventListener('keydown', keydownHandler);
    addEventListener('keyup', keyupHandler);
    if (this.mouseTarget) {
      this.mouseTarget.addEventListener('mousedown', mousedownHandler);
      this.mouseTarget.addEventListener('mouseup', mouseupHandler);
      this.mouseTarget.addEventListener('wheel', wheelHandler);
    }

    this.stopper = () => {
      this.isRunning = false;
      removeEventListener('keydown', keydownHandler);
      removeEventListener('keyup', keyupHandler);
      if (this.mouseTarget) {
        this.mouseTarget.removeEventListener('mousedown', mousedownHandler);
        this.mouseTarget.removeEventListener('mouseup', mouseupHandler);
        this.mouseTarget.addEventListener('wheel', wheelHandler);
      }
    };
  }

  stop() {
    this.stopper();
  }

  isStopped() {return !this.isRunning;}
}