import {
  DOG_CONFIG,
  MARKER_CONFIG,
  ROUND_CONFIG,
  SOCK_SPAWN_POINTS,
} from "../game/config";
import { takeRandomItems } from "../utils/math";
import {
  attachSockToDog,
  createObjectiveMarkers,
  createSock,
  placeSockAt,
  placeSockByOwner,
  setSockDelivered,
  setSockFocus,
} from "./sock";

export class SockManager {
  constructor({ scene, dog, owner }) {
    this.scene = scene;
    this.dog = dog;
    this.owner = owner;
    this.totalSocks = ROUND_CONFIG.socksPerRound;
    this.socks = Array.from({ length: this.totalSocks }, () => createSock(scene));
    this.markers = createObjectiveMarkers(scene);
    this.activeIndex = 0;
    this.returnedCount = 0;
    this.carriedSock = null;
  }

  getReturnedCount() {
    return this.returnedCount;
  }

  getTotalSocks() {
    return this.totalSocks;
  }

  isCarryingSock() {
    return this.carriedSock !== null;
  }

  getActiveSock() {
    if (this.activeIndex >= this.socks.length) {
      return null;
    }

    return this.socks[this.activeIndex];
  }

  resetRound() {
    const spawnPoints = takeRandomItems(SOCK_SPAWN_POINTS, this.totalSocks);
    this.activeIndex = 0;
    this.returnedCount = 0;
    this.carriedSock = null;

    this.socks.forEach((sock, index) => {
      placeSockAt({
        sock,
        scene: this.scene,
        position: spawnPoints[index],
        rotationY: Math.random() * Math.PI,
      });
      setSockFocus(sock, index === 0);
    });
  }

  tryPickup(dogPosition) {
    if (this.carriedSock) {
      return false;
    }

    const activeSock = this.getActiveSock();
    if (!activeSock) {
      return false;
    }

    if (dogPosition.distanceTo(activeSock.position) >= DOG_CONFIG.pickupDistance) {
      return false;
    }

    this.carriedSock = activeSock;
    attachSockToDog({ sock: activeSock, dog: this.dog });
    return true;
  }

  tryReturn(dogPosition, tempVector) {
    if (!this.carriedSock) {
      return { returned: false, roundComplete: false, returnedCount: this.returnedCount };
    }

    const ownerPosition = this.owner.getWorldPosition(tempVector);
    if (dogPosition.distanceTo(ownerPosition) >= DOG_CONFIG.returnDistance) {
      return { returned: false, roundComplete: false, returnedCount: this.returnedCount };
    }

    const deliveredSock = this.carriedSock;
    this.carriedSock = null;

    placeSockByOwner({
      sock: deliveredSock,
      scene: this.scene,
      owner: this.owner,
      deliveryIndex: this.returnedCount,
    });
    setSockDelivered(deliveredSock);

    this.returnedCount += 1;
    this.activeIndex = this.returnedCount;

    const nextSock = this.getActiveSock();
    if (nextSock) {
      setSockFocus(nextSock, true);
    }

    return {
      returned: true,
      roundComplete: this.returnedCount >= this.socks.length,
      returnedCount: this.returnedCount,
    };
  }

  hideMarkers() {
    this.markers.sockMarker.visible = false;
    this.markers.ownerMarker.visible = false;
  }

  updateMarkers({ elapsed, gameStarted }) {
    if (!gameStarted) {
      this.hideMarkers();
      return;
    }

    const bob = Math.sin(elapsed * MARKER_CONFIG.bobSpeed) * MARKER_CONFIG.bobHeight;

    if (this.carriedSock) {
      this.markers.ownerMarker.visible = true;
      this.markers.ownerMarker.position.set(
        this.owner.position.x,
        MARKER_CONFIG.ownerHeight + bob,
        this.owner.position.z,
      );
      this.markers.ownerMarker.rotation.y = elapsed * MARKER_CONFIG.ownerSpinSpeed;
      this.markers.sockMarker.visible = false;
      return;
    }

    const activeSock = this.getActiveSock();
    if (!activeSock) {
      this.hideMarkers();
      return;
    }

    this.markers.sockMarker.visible = true;
    this.markers.sockMarker.position.set(
      activeSock.position.x,
      MARKER_CONFIG.sockHeight + bob,
      activeSock.position.z,
    );
    this.markers.sockMarker.rotation.y = elapsed * MARKER_CONFIG.sockSpinSpeed;
    this.markers.ownerMarker.visible = false;
  }
}
