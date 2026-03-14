import { CAMERA_CONFIG, JOYSTICK_CONFIG } from "../game/config";
import { clamp, getJoystickVector } from "../utils/math";

function isTouchOnElement(touch, element) {
  return element !== null && touch.target instanceof Element && element.contains(touch.target);
}

export function registerTouchControls({
  canvas,
  movePad,
  moveKnob,
  sniffButton,
  sprintButton,
  inputState,
  onSniff,
  pointerState,
  touchState,
}) {
  function setMoveVector(x, y) {
    touchState.moveVector.set(x, y);
    inputState.moveX = x;
    inputState.moveY = y;
    moveKnob.style.transform = `translate(${x * JOYSTICK_CONFIG.knobTravel}px, ${y * JOYSTICK_CONFIG.knobTravel}px)`;
  }

  function clearMoveVector() {
    setMoveVector(0, 0);
  }

  function handlePointerDown() {
    pointerState.active = true;
  }

  function handlePointerUp() {
    pointerState.active = false;
  }

  function handlePointerMove(event) {
    if (!pointerState.active) return;

    pointerState.yaw -= event.movementX * CAMERA_CONFIG.mouseYawSpeed;
    pointerState.pitch = clamp(
      pointerState.pitch - event.movementY * CAMERA_CONFIG.mousePitchSpeed,
      CAMERA_CONFIG.minPitch,
      CAMERA_CONFIG.maxPitch,
    );
  }

  function handleMoveTouchStart(event) {
    const touch = event.changedTouches[0];
    touchState.moveId = touch.identifier;

    const rect = movePad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const { x, y } = getJoystickVector(
      touch.clientX - centerX,
      touch.clientY - centerY,
      JOYSTICK_CONFIG.maxDistance,
    );

    setMoveVector(x, y);
  }

  function handleMoveTouchMove(event) {
    for (const touch of event.changedTouches) {
      if (touch.identifier !== touchState.moveId) continue;

      const rect = movePad.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const { x, y } = getJoystickVector(
        touch.clientX - centerX,
        touch.clientY - centerY,
        JOYSTICK_CONFIG.maxDistance,
      );

      setMoveVector(x, y);
    }
  }

  function handleMoveTouchEnd(event) {
    for (const touch of event.changedTouches) {
      if (touch.identifier !== touchState.moveId) continue;
      touchState.moveId = null;
      clearMoveVector();
    }
  }

  function handleSprintStart() {
    inputState.sprint = true;
  }

  function handleSprintEnd() {
    inputState.sprint = false;
  }

  function handleSniff(event) {
    event.preventDefault();
    onSniff();
  }

  function handleLookTouchStart(event) {
    for (const touch of event.changedTouches) {
      if (touch.identifier === touchState.moveId) continue;
      if (touchState.lookId !== null) continue;
      if (
        isTouchOnElement(touch, movePad) ||
        isTouchOnElement(touch, sprintButton) ||
        isTouchOnElement(touch, sniffButton)
      ) {
        continue;
      }

      touchState.lookId = touch.identifier;
      pointerState.x = touch.clientX;
      pointerState.y = touch.clientY;
    }
  }

  function handleLookTouchMove(event) {
    for (const touch of event.changedTouches) {
      if (touch.identifier !== touchState.lookId) continue;

      const dx = touch.clientX - pointerState.x;
      const dy = touch.clientY - pointerState.y;

      pointerState.x = touch.clientX;
      pointerState.y = touch.clientY;
      pointerState.yaw -= dx * CAMERA_CONFIG.touchYawSpeed;
      pointerState.pitch = clamp(
        pointerState.pitch - dy * CAMERA_CONFIG.touchPitchSpeed,
        CAMERA_CONFIG.minPitch,
        CAMERA_CONFIG.maxPitch,
      );
    }
  }

  function clearLookTouch(event) {
    for (const touch of event.changedTouches) {
      if (touch.identifier === touchState.lookId) {
        touchState.lookId = null;
      }
    }
  }

  canvas.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointermove", handlePointerMove);

  movePad.addEventListener("touchstart", handleMoveTouchStart, { passive: true });
  movePad.addEventListener("touchmove", handleMoveTouchMove, { passive: true });
  movePad.addEventListener("touchend", handleMoveTouchEnd, { passive: true });
  movePad.addEventListener("touchcancel", handleMoveTouchEnd, { passive: true });

  sprintButton.addEventListener("touchstart", handleSprintStart, { passive: true });
  sprintButton.addEventListener("touchend", handleSprintEnd, { passive: true });
  sprintButton.addEventListener("touchcancel", handleSprintEnd, { passive: true });

  sniffButton.addEventListener("touchstart", handleSniff, { passive: false });
  sniffButton.addEventListener("click", handleSniff);

  window.addEventListener("touchstart", handleLookTouchStart, { passive: true });
  window.addEventListener("touchmove", handleLookTouchMove, { passive: true });
  window.addEventListener("touchend", clearLookTouch, { passive: true });
  window.addEventListener("touchcancel", clearLookTouch, { passive: true });

  return () => {
    canvas.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointermove", handlePointerMove);

    movePad.removeEventListener("touchstart", handleMoveTouchStart);
    movePad.removeEventListener("touchmove", handleMoveTouchMove);
    movePad.removeEventListener("touchend", handleMoveTouchEnd);
    movePad.removeEventListener("touchcancel", handleMoveTouchEnd);

    sprintButton.removeEventListener("touchstart", handleSprintStart);
    sprintButton.removeEventListener("touchend", handleSprintEnd);
    sprintButton.removeEventListener("touchcancel", handleSprintEnd);

    sniffButton.removeEventListener("touchstart", handleSniff);
    sniffButton.removeEventListener("click", handleSniff);

    window.removeEventListener("touchstart", handleLookTouchStart);
    window.removeEventListener("touchmove", handleLookTouchMove);
    window.removeEventListener("touchend", clearLookTouch);
    window.removeEventListener("touchcancel", clearLookTouch);
  };
}
