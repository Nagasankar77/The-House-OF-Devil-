import * as THREE from 'three';

export class CinematicMaterials {
  // Skin Materials
  public static skin(tone = 0xd49b78): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: tone,
      roughness: 0.65,
      metalness: 0.05,
    });
  }

  public static skinDark(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x996144,
      roughness: 0.68,
      metalness: 0.05,
    });
  }

  // Hair Materials
  public static hairDark(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x1a120c,
      roughness: 0.85,
      metalness: 0.1,
    });
  }

  public static hairBrown(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x3d2516,
      roughness: 0.8,
      metalness: 0.1,
    });
  }

  // Clothing Materials
  public static leatherJacket(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x2e2019,
      roughness: 0.45,
      metalness: 0.15,
    });
  }

  public static denimJeans(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x23374d,
      roughness: 0.85,
      metalness: 0.05,
    });
  }

  public static sisterSweater(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xd99b26, // Warm Mustard Yellow
      roughness: 0.88,
      metalness: 0.02,
    });
  }

  public static sisterChildDress(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xc8707e, // Soft floral pink
      roughness: 0.8,
      metalness: 0.02,
    });
  }

  public static brotherChildShirt(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xa88358, // Earthy Khaki tan
      roughness: 0.85,
      metalness: 0.02,
    });
  }

  public static casualHoodie(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x343a40,
      roughness: 0.9,
      metalness: 0.02,
    });
  }

  public static casualGreenJacket(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x2e3d30,
      roughness: 0.85,
      metalness: 0.05,
    });
  }

  // Environment Materials
  public static wood(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x543d2b,
      roughness: 0.75,
      metalness: 0.05,
    });
  }

  public static darkWood(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x160e0a,
      roughness: 0.72,
      metalness: 0.08,
    });
  }

  public static stoneWall(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x22181b,
      roughness: 0.92,
      metalness: 0.08,
    });
  }

  public static wetGround(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x101311,
      roughness: 0.28,
      metalness: 0.35,
    });
  }

  public static glassBottle(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0x153832,
      roughness: 0.15,
      metalness: 0.05,
      transmission: 0.8,
      thickness: 0.5,
      transparent: true,
      opacity: 0.85,
    });
  }
}
