import * as THREE from "three";
import { createCharacter } from "./character.js";

const LANES = [-2.1, 0, 2.1];
const TRACK_LENGTH = 140;

export class OrbitalRun {
  constructor(container, onUpdate) {
    this.container = container;
    this.onUpdate = onUpdate;
    this.clock = new THREE.Clock();
    this.lane = 1;
    this.objects = [];
    this.running = false;
    this.distance = 0;
    this.stardust = 0;
    this.spawnTimer = 0;
    this.reportedDistance = -1;
    this.reportedStardust = -1;
    this.player = null;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#090c19");
    this.scene.fog = new THREE.Fog("#090c19", 17, 76);

    this.camera = new THREE.PerspectiveCamera(43, 1, 0.1, 110);
    this.camera.position.set(0, 5.1, 9.2);
    this.camera.lookAt(0, 1.1, -5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.append(this.renderer.domElement);

    this.addLights();
    this.addTrack();
    this.addStars();
    this.setCharacter({});
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.resize();
    this.animate = this.animate.bind(this);
    this.frameId = requestAnimationFrame(this.animate);
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight("#d9dcff", "#121623", 2.1));

    const keyLight = new THREE.DirectionalLight("#fff4df", 3.6);
    keyLight.position.set(-5, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(keyLight);

    const rimLight = new THREE.PointLight("#8866ff", 20, 35);
    rimLight.position.set(5, 5, -8);
    this.scene.add(rimLight);
  }

  addTrack() {
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(9.4, TRACK_LENGTH),
      new THREE.MeshStandardMaterial({
        color: "#131828",
        roughness: 0.84,
        metalness: 0.1,
      })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.z = -TRACK_LENGTH / 2 + 8;
    road.receiveShadow = true;
    this.scene.add(road);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500),
      new THREE.MeshStandardMaterial({ color: "#090c19", roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.09;
    ground.position.z = -90;
    this.scene.add(ground);

    this.trackMarks = [];
    for (let index = 0; index < 22; index += 1) {
      const z = 5 - index * 6;
      for (const x of [-1.05, 1.05]) {
        const marker = new THREE.Mesh(
          new THREE.BoxGeometry(0.035, 0.018, 2.5),
          new THREE.MeshStandardMaterial({
            color: "#343c58",
            emissive: "#11172c",
            roughness: 0.65,
          })
        );
        marker.position.set(x, 0.015, z);
        marker.userData.startZ = z;
        this.scene.add(marker);
        this.trackMarks.push(marker);
      }
    }

    for (const x of [-4.5, 4.5]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, TRACK_LENGTH),
        new THREE.MeshStandardMaterial({
          color: "#7e6cf5",
          emissive: "#4531b5",
          emissiveIntensity: 1.2,
        })
      );
      rail.position.set(x, 0.04, -TRACK_LENGTH / 2 + 8);
      this.scene.add(rail);
    }
  }

  addStars() {
    const vertices = [];
    for (let index = 0; index < 260; index += 1) {
      vertices.push(
        (Math.random() - 0.5) * 110,
        Math.random() * 42 + 3,
        -Math.random() * 120 - 8
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    this.scene.add(
      new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: "#d2d0ff",
          size: 0.12,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.8,
        })
      )
    );
  }

  setCharacter(style) {
    if (this.player) {
      this.scene.remove(this.player);
      this.player.traverse((child) => {
        if (!child.isMesh) return;
        child.geometry.dispose();
        child.material.dispose();
      });
    }
    this.player = createCharacter(style);
    this.player.position.set(LANES[this.lane], 0, 2);
    this.scene.add(this.player);
  }

  start() {
    this.clearObjects();
    this.distance = 0;
    this.stardust = 0;
    this.reportedDistance = -1;
    this.reportedStardust = -1;
    this.lane = 1;
    this.player.position.x = LANES[this.lane];
    for (const marker of this.trackMarks) {
      marker.position.z = marker.userData.startZ;
    }
    this.running = true;
    this.spawnTimer = 0.35;
    this.clock.getDelta();
    this.onUpdate({ distance: 0, stardust: 0 });
  }

  move(direction) {
    if (!this.running) return;
    this.lane = THREE.MathUtils.clamp(this.lane + direction, 0, LANES.length - 1);
  }

  spawnRow() {
    const hazardLane = Math.floor(Math.random() * LANES.length);
    const rewardLane = (hazardLane + (Math.random() < 0.5 ? 1 : 2)) % 3;
    const hazard = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.62, 0),
      new THREE.MeshStandardMaterial({
        color: "#ff785f",
        emissive: "#74231e",
        emissiveIntensity: 0.9,
        roughness: 0.42,
      })
    );
    hazard.position.set(LANES[hazardLane], 0.65, -44);
    hazard.castShadow = true;
    hazard.userData = { kind: "hazard", lane: hazardLane };
    this.scene.add(hazard);
    this.objects.push(hazard);

    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({
        color: "#ffd66b",
        emissive: "#e2872d",
        emissiveIntensity: 1.8,
        metalness: 0.55,
        roughness: 0.25,
      })
    );
    star.position.set(LANES[rewardLane], 1.05, -44);
    star.userData = { kind: "star", lane: rewardLane };
    this.scene.add(star);
    this.objects.push(star);
  }

  clearObjects() {
    for (const object of this.objects) {
      this.scene.remove(object);
      object.geometry.dispose();
      object.material.dispose();
    }
    this.objects = [];
  }

  endRun() {
    this.running = false;
    this.onUpdate({
      distance: Math.floor(this.distance),
      stardust: this.stardust,
      gameOver: true,
    });
  }

  update(delta) {
    if (!this.running) {
      this.player.position.x = THREE.MathUtils.damp(
        this.player.position.x,
        LANES[this.lane],
        10,
        delta
      );
      return;
    }

    const speed = Math.min(17 + this.distance * 0.012, 27);
    this.distance += speed * delta;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnRow();
      this.spawnTimer = Math.max(1.1, 1.55 - this.distance * 0.0007);
    }

    this.player.position.x = THREE.MathUtils.damp(
      this.player.position.x,
      LANES[this.lane],
      12,
      delta
    );
    this.player.position.y = 0.04 + Math.abs(Math.sin(this.distance * 0.6)) * 0.08;
    this.player.rotation.z = THREE.MathUtils.damp(
      this.player.rotation.z,
      (LANES[this.lane] - this.player.position.x) * 0.08,
      8,
      delta
    );

    for (const marker of this.trackMarks) {
      marker.position.z += speed * delta;
      if (marker.position.z > 8) marker.position.z -= 132;
    }

    for (let index = this.objects.length - 1; index >= 0; index -= 1) {
      const object = this.objects[index];
      object.position.z += speed * delta;
      if (object.userData.kind === "star") {
        object.rotation.y += delta * 2.6;
        object.rotation.x += delta * 1.2;
        object.position.y = 1.05 + Math.sin(this.distance * 0.09) * 0.1;
      }

      if (object.position.z >= 1.5 && object.position.z <= 2.9) {
        if (object.userData.lane === this.lane) {
          if (object.userData.kind === "hazard") {
            this.endRun();
            return;
          }
          this.stardust += 1;
          this.scene.remove(object);
          object.geometry.dispose();
          object.material.dispose();
          this.objects.splice(index, 1);
          continue;
        }
      }

      if (object.position.z > 9) {
        this.scene.remove(object);
        object.geometry.dispose();
        object.material.dispose();
        this.objects.splice(index, 1);
      }
    }

    const reportedDistance = Math.floor(this.distance);
    if (
      reportedDistance !== this.reportedDistance ||
      this.stardust !== this.reportedStardust
    ) {
      this.reportedDistance = reportedDistance;
      this.reportedStardust = this.stardust;
      this.onUpdate({
        distance: reportedDistance,
        stardust: this.stardust,
      });
    }
  }

  resize() {
    const { clientWidth, clientHeight } = this.container;
    if (!clientWidth || !clientHeight) return;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight, false);
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.animate);
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    this.clearObjects();
    this.renderer.dispose();
    this.container.replaceChildren();
  }
}
