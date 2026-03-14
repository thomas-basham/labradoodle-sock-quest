export function registerKeyboardControls({ inputState, onStart }) {
  function handleKeyDown(event) {
    const key = event.key.toLowerCase();

    if (key === "w" || key === "arrowup") inputState.forward = true;
    if (key === "s" || key === "arrowdown") inputState.backward = true;
    if (key === "a" || key === "arrowleft") inputState.left = true;
    if (key === "d" || key === "arrowright") inputState.right = true;
    if (key === "shift") inputState.sprint = true;
    if (key === "enter") onStart();
  }

  function handleKeyUp(event) {
    const key = event.key.toLowerCase();

    if (key === "w" || key === "arrowup") inputState.forward = false;
    if (key === "s" || key === "arrowdown") inputState.backward = false;
    if (key === "a" || key === "arrowleft") inputState.left = false;
    if (key === "d" || key === "arrowright") inputState.right = false;
    if (key === "shift") inputState.sprint = false;
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
  };
}
