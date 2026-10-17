import * as THREE from "three";

const FALLBACK_STYLE = {
  body: "male",
  primaryColor: "#7775ff",
  secondaryColor: "#30344f",
  skinColor: "#c58d65",
  hairColor: "#252034",
  hair: "short",
  hat: "none",
  accessory: "none",
};

function styleColor(value, fallback) {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value)
    ? value
    : fallback;
}

function material(color, roughness = 0.7, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addMesh(
  group,
  geometry,
  color,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  options = {}
) {
  const mesh = new THREE.Mesh(
    geometry,
    material(color, options.roughness, options.metalness)
  );
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addCapsule(group, color, start, end, radius) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(to, from);
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, Math.max(0.01, direction.length()), 3, 6),
    material(color)
  );
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addHair(group, hair, color) {
  const headTop = 2.1;
  const hairCap = addMesh(
    group,
    new THREE.SphereGeometry(0.36, 10, 8),
    color,
    [0, headTop + 0.04, 0],
    [1.04, 0.72, 1],
    { roughness: 0.95 }
  );

  if (hair === "bald") {
    group.remove(hairCap);
    hairCap.geometry.dispose();
    hairCap.material.dispose();
    return;
  }

  if (hair === "afro") {
    const curlGeometry = new THREE.SphereGeometry(0.105, 7, 6);
    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2;
      addMesh(
        group,
        curlGeometry,
        color,
        [Math.cos(angle) * 0.3, headTop + 0.12, Math.sin(angle) * 0.28],
        [1, 1, 1],
        { roughness: 1 }
      );
    }
    return;
  }

  if (hair === "braids" || hair === "dreads") {
    const count = hair === "braids" ? 5 : 4;
    for (let index = 0; index < count; index += 1) {
      const x = (index - (count - 1) / 2) * 0.1;
      const length = hair === "dreads" ? 0.47 : 0.35;
      addCapsule(
        group,
        color,
        [x, headTop - 0.03, -0.2],
        [x, headTop - length, -0.2],
        hair === "dreads" ? 0.045 : 0.025
      );
    }
    return;
  }

  if (hair === "ponytail") {
    addCapsule(
      group,
      color,
      [0.18, headTop + 0.02, -0.24],
      [0.31, headTop - 0.43, -0.35],
      0.075
    );
  } else if (hair === "bun") {
    addMesh(
      group,
      new THREE.SphereGeometry(0.13, 8, 8),
      color,
      [0, headTop + 0.27, -0.12],
      [1, 1, 1]
    );
  } else if (hair === "short") {
    addMesh(
      group,
      new THREE.BoxGeometry(0.46, 0.11, 0.4),
      color,
      [0, headTop + 0.22, 0.02],
      [1, 1, 1]
    );
  }
}

function addHat(group, hat, primaryColor) {
  if (hat === "cap" || hat === "beanie") {
    addMesh(
      group,
      new THREE.SphereGeometry(0.35, 10, 8),
      primaryColor,
      [0, 2.37, 0],
      [1, 0.58, 1],
      { roughness: 0.85 }
    );
    if (hat === "cap") {
      addMesh(
        group,
        new THREE.BoxGeometry(0.46, 0.055, 0.29),
        primaryColor,
        [0, 2.29, 0.2],
        [1, 1, 1]
      );
    } else {
      addMesh(
        group,
        new THREE.SphereGeometry(0.06, 8, 6),
        primaryColor,
        [0, 2.58, 0],
        [1, 0.8, 1]
      );
    }
  } else if (hat === "tophat") {
    addMesh(
      group,
      new THREE.CylinderGeometry(0.22, 0.25, 0.08, 10),
      primaryColor,
      [0, 2.3, 0]
    );
    addMesh(
      group,
      new THREE.CylinderGeometry(0.16, 0.19, 0.35, 10),
      primaryColor,
      [0, 2.5, 0]
    );
  } else if (hat === "crown") {
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.29, 0.31, 0.19, 5, 1, false),
      material("#ffd66b", 0.3, 0.65)
    );
    crown.position.set(0, 2.4, 0);
    crown.castShadow = true;
    group.add(crown);
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      addMesh(
        group,
        new THREE.SphereGeometry(0.045, 6, 6),
        "#fff1ad",
        [Math.cos(angle) * 0.25, 2.53, Math.sin(angle) * 0.25],
        [1, 1, 1],
        { metalness: 0.7, roughness: 0.25 }
      );
    }
  }
}

function addAccessory(group, accessory, hairColor, primaryColor) {
  if (accessory === "glasses") {
    const frameMaterial = material("#20202a", 0.3, 0.2);
    for (const x of [-0.13, 0.13]) {
      const frame = new THREE.Mesh(
        new THREE.TorusGeometry(0.105, 0.018, 5, 12),
        frameMaterial
      );
      frame.position.set(x, 2.12, 0.282);
      group.add(frame);
    }
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.018, 0.018),
      frameMaterial
    );
    bridge.position.set(0, 2.12, 0.29);
    group.add(bridge);
  } else if (accessory === "earrings") {
    for (const x of [-0.31, 0.31]) {
      addMesh(
        group,
        new THREE.SphereGeometry(0.035, 7, 6),
        "#ffe08a",
        [x, 1.98, 0.03],
        [1, 1, 1],
        { metalness: 0.75, roughness: 0.22 }
      );
    }
  } else if (accessory === "beard") {
    addMesh(
      group,
      new THREE.SphereGeometry(0.23, 9, 7),
      hairColor,
      [0, 1.92, 0.1],
      [0.92, 0.65, 0.65]
    );
  } else if (accessory === "scarf") {
    addMesh(
      group,
      new THREE.TorusGeometry(0.27, 0.08, 6, 12),
      primaryColor,
      [0, 1.63, 0],
      [1, 1, 0.7]
    );
  } else if (accessory === "backpack") {
    addMesh(
      group,
      new THREE.BoxGeometry(0.43, 0.52, 0.24),
      primaryColor,
      [0, 1.3, -0.35],
      [1, 1, 1]
    );
  }
}

export function createCharacter(style = {}) {
  const appearance = { ...FALLBACK_STYLE, ...style };
  const topColor = styleColor(appearance.primaryColor, FALLBACK_STYLE.primaryColor);
  const bottomColor = styleColor(
    appearance.secondaryColor,
    FALLBACK_STYLE.secondaryColor
  );
  const skinColor = styleColor(appearance.skinColor, FALLBACK_STYLE.skinColor);
  const hairColor = styleColor(appearance.hairColor, FALLBACK_STYLE.hairColor);
  const group = new THREE.Group();

  addMesh(
    group,
    new THREE.SphereGeometry(0.32, 12, 10),
    skinColor,
    [0, 2.08, 0],
    [0.88, 1.08, 0.82]
  );

  if (appearance.body === "female") {
    addMesh(
      group,
      new THREE.CylinderGeometry(0.28, 0.42, 0.35, 9),
      bottomColor,
      [0, 0.82, 0]
    );
  } else {
    addMesh(
      group,
      new THREE.BoxGeometry(0.54, 0.22, 0.35),
      bottomColor,
      [0, 0.83, 0]
    );
  }

  addMesh(
    group,
    new THREE.SphereGeometry(0.44, 10, 9),
    topColor,
    [0, 1.38, 0],
    appearance.body === "female" ? [0.8, 1.1, 0.66] : [1, 1, 0.7]
  );

  for (const x of [-0.17, 0.17]) {
    addCapsule(group, bottomColor, [x, 0.79, 0], [x, 0.22, 0.02], 0.105);
    addMesh(
      group,
      new THREE.BoxGeometry(0.19, 0.12, 0.33),
      "#202235",
      [x, 0.11, 0.09]
    );
  }

  for (const side of [-1, 1]) {
    addCapsule(
      group,
      topColor,
      [side * 0.38, 1.55, 0],
      [side * 0.55, 1.1, 0.02],
      0.105
    );
    addCapsule(
      group,
      skinColor,
      [side * 0.55, 1.1, 0.02],
      [side * 0.52, 0.91, 0.1],
      0.07
    );
  }

  addMesh(
    group,
    new THREE.SphereGeometry(0.035, 6, 6),
    "#f7eee6",
    [-0.105, 2.11, 0.265],
    [0.65, 1, 0.45]
  );
  addMesh(
    group,
    new THREE.SphereGeometry(0.035, 6, 6),
    "#f7eee6",
    [0.105, 2.11, 0.265],
    [0.65, 1, 0.45]
  );
  addMesh(
    group,
    new THREE.SphereGeometry(0.018, 6, 6),
    "#24202a",
    [-0.105, 2.11, 0.295],
    [1, 1, 0.6]
  );
  addMesh(
    group,
    new THREE.SphereGeometry(0.018, 6, 6),
    "#24202a",
    [0.105, 2.11, 0.295],
    [1, 1, 0.6]
  );

  addHair(group, appearance.hair, hairColor);
  addHat(group, appearance.hat, topColor);
  addAccessory(group, appearance.accessory, hairColor, topColor);
  group.scale.setScalar(0.88);

  return group;
}
