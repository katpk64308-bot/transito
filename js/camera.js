export function createCameraController(camera, state) {
  const position = new THREE.Vector3(state.x, 6, state.z - 10);
  const lookTarget = new THREE.Vector3();

  return function updateCamera(dt) {
    const forwardX = Math.sin(state.heading);
    const forwardZ = Math.cos(state.heading);
    const desiredPosition = new THREE.Vector3(state.x - forwardX * 9, 4.6, state.z - forwardZ * 9);
    position.lerp(desiredPosition, Math.min(1, dt * 4.5));
    camera.position.copy(position);

    const desiredLook = new THREE.Vector3(state.x + forwardX * 5, 1.6, state.z + forwardZ * 5);
    lookTarget.lerp(desiredLook, Math.min(1, dt * 6));
    camera.lookAt(lookTarget);
  };
}
