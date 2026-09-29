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

  public static yaminiSweater(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xd99b26, // Warm Mustard Yellow
      roughness: 0.88,
      metalness: 0.02,
    });
  }

  public static yaminiChildDress(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xc8707e, // Soft floral pink
      roughness: 0.8,
      metalness: 0.02,
    });
  }

  public static sankarChildShirt(): THREE.MeshStandardMaterial {
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
      color: 0x261a12,
      roughness: 0.7,
      metalness: 0.05,
    });
  }

  public static stoneWall(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x47494a,
      roughness: 0.9,
      metalness: 0.1,
    });
  }

  public static wetGround(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x1f2329,
      roughness: 0.25,
      metalness: 0.35,
    });
  }

  public static glassBottle(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0x336644,
      roughness: 0.1,
      metalness: 0.05,
      transmission: 0.8,
      thickness: 0.5,
      transparent: true,
      opacity: 0.85,
    });
  }
}
