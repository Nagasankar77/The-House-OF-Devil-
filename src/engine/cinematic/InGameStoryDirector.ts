import * as THREE from 'three';
import { HorrorEnvironment } from '../Environment';
import { PlayerController } from '../PlayerController';
import { horrorAudio } from '../../audio/HorrorAudioManager';
import { CinematicCharacters, CinematicCharacterRig } from '../../components/cinematic/CinematicCharacters';
import { CinematicEnvironments } from '../../components/cinematic/CinematicEnvironments';

export interface StorySubtitleData {
  speaker: string;
  text: string;
  sceneIndex: number;
  totalScenes: number;
  sceneTitle: string;
}

export interface StoryDirectorCallbacks {
  onSubtitleChange?: (sub: StorySubtitleData | null) => void;
  onComplete?: () => void;
}

interface SceneDefinition {
  title: string;
  theme: 'CHILDHOOD' | 'RESPONSIBILITY' | 'COLLEGE' | 'TRUTH_OR_DARE' | 'RULES' | 'APPROACH' | 'DISAPPEAR' | 'SEARCH' | 'CONFRONT' | 'DECISION';
  duration: number; // seconds
  lines: Array<{
    speaker: string;
    text: string;
    start: number; // seconds into scene
    duration: number;
  }>;
  setup: (stage: THREE.Group, anim: Record<string, any>) => void;
  update: (progress: number, delta: number, elapsed: number, anim: Record<string, any>, cam: THREE.PerspectiveCamera) => void;
}

export class InGameStoryDirector {
  public isActive = false;
  public callbacks: StoryDirectorCallbacks = {};

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private environment: HorrorEnvironment;
  private player: PlayerController;

  // Staged Memory Theater Group (placed far above or adjacent to main map)
  private memoryStageGroup: THREE.Group;
  private currentSceneIdx = 0;
  private sceneElapsed = 0;
  private animData: Record<string, any> = {};

  // Camera restore state
  private savedCameraPos = new THREE.Vector3();
  private savedCameraRot = new THREE.Euler();
  private savedFov = 75;

  private scenes: SceneDefinition[] = [];
  private currentSpeechUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    environment: HorrorEnvironment,
    player: PlayerController
  ) {
    this.scene = scene;
    this.camera = camera;
    this.environment = environment;
    this.player = player;

    // Isolated memory stage positioned safely at y = 150
    this.memoryStageGroup = new THREE.Group();
    this.memoryStageGroup.position.set(0, 150, 0);
    this.memoryStageGroup.visible = false;
    this.scene.add(this.memoryStageGroup);

    this.initScenes();
  }

  private initScenes(): void {
    // -------------------------------------------------------------
    // SCENE 1: CHILDHOOD BOND
    // -------------------------------------------------------------
    this.scenes.push({
      title: 'SCENE 01 // CHILDHOOD - KAKINADA',
      theme: 'CHILDHOOD',
      duration: 11.5,
      lines: [
        {
          speaker: 'SANKAR',
          text: 'My name is Sankar. I have a younger sister. Her name is Yamini.',
          start: 0.5,
          duration: 4.8,
        },
        {
          speaker: 'SANKAR',
          text: 'We grew up without our parents... but we always had each other. Yamini was my family.',
          start: 5.5,
          duration: 5.5,
        },
      ],
      setup: (stage, anim) => {
        CinematicEnvironments.buildChildhoodCourtyard(stage);

        const youngSankar = CinematicCharacters.createYoungSankar();
        youngSankar.root.position.set(-0.6, 0, 1.2);
        youngSankar.root.rotation.y = 0.5;
        stage.add(youngSankar.root);
        anim.youngSankar = youngSankar;

        const youngYamini = CinematicCharacters.createYoungYamini();
        youngYamini.root.position.set(0.6, 0, 1.4);
        youngYamini.root.rotation.y = -0.5;
        stage.add(youngYamini.root);
        anim.youngYamini = youngYamini;
      },
      update: (progress, delta, elapsed, anim, cam) => {
        // Slow cinematic push-in from wide veranda to warm intimate two-shot
        const startPos = new THREE.Vector3(0, 151.8, 6.5);
        const endPos = new THREE.Vector3(0, 151.35, 3.8);
        cam.position.lerpVectors(startPos, endPos, progress);
        cam.lookAt(0, 150.9, 1.3);

        const t = elapsed;
        anim.youngSankar?.update(t, delta, {
          isTalking: elapsed < 5.0 || (elapsed > 5.5 && elapsed < 9.5),
          gesture: 'OFFER',
          lookTarget: anim.youngYamini?.root.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
        });
        anim.youngYamini?.update(t, delta, {
          gesture: 'WAVE',
          lookTarget: anim.youngSankar?.root.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
        });
      },
    });

    // -------------------------------------------------------------
    // SCENE 2: RESPONSIBILITY & LATE NIGHTS
    // -------------------------------------------------------------
    this.scenes.push({
      title: 'SCENE 02 // RESPONSIBILITY',
      theme: 'RESPONSIBILITY',
      duration: 11.0,
      lines: [
        {
          speaker: 'SANKAR',
          text: 'As we grew older, I started working. I did not have much...',
          start: 0.5,
          duration: 4.5,
        },
        {
          speaker: 'SANKAR',
          text: 'But I always made sure Yamini had what she needed for college. I did everything I could for her.',
          start: 5.2,
          duration: 5.4,
        },
      ],
      setup: (stage, anim) => {
        CinematicEnvironments.buildWorkAndHomeEnvironment(stage);

        const sankar = CinematicCharacters.createSankar();
        sankar.root.position.set(0.7, 0, 0.4);
        sankar.root.rotation.y = -1.2;
        stage.add(sankar.root);
        anim.sankar = sankar;

        const yamini = CinematicCharacters.createYamini();
        yamini.root.position.set(-0.7, 0, 0.4);
        yamini.root.rotation.y = 1.2;
        stage.add(yamini.root);
        anim.yamini = yamini;
      },
      update: (progress, delta, elapsed, anim, cam) => {
        // Slow pan across the warm wooden desk under glowing lamplight
        const startPos = new THREE.Vector3(-2.2, 151.6, 2.8);
        const endPos = new THREE.Vector3(1.8, 151.5, 2.4);
        cam.position.lerpVectors(startPos, endPos, progress);
        cam.lookAt(0, 150.9, 0.2);

        const t = elapsed;
        anim.sankar?.update(t, delta, {
          isTalking: elapsed < 5.0 || (elapsed > 5.5 && elapsed < 9.5),
          gesture: 'POINT',
        });
        anim.yamini?.update(t, delta, {
          isSitting: true,
          gesture: 'NONE',
        });
      },
    });

    // -------------------------------------------------------------
    // SCENE 3: YAMINI IN COLLEGE
    // -------------------------------------------------------------
    this.scenes.push({
      title: 'SCENE 03 // COLLEGE DREAMS',
      theme: 'COLLEGE',
      duration: 9.5,
      lines: [
        {
          speaker: 'SANKAR',
          text: 'Yamini had her own world too.',
          start: 0.5,
          duration: 3.5,
        },
        {
          speaker: 'SANKAR',
          text: 'Her college... her friends... her dreams.',
          start: 4.2,
          duration: 4.8,
        },
      ],
      setup: (stage, anim) => {
        CinematicEnvironments.buildCollegeCampus(stage);

        const yamini = CinematicCharacters.createYamini();
        yamini.root.position.set(0, 0, 4.0);
        stage.add(yamini.root);
        anim.yamini = yamini;

        const meera = CinematicCharacters.createMeera();
        meera.root.position.set(1.4, 0, 3.2);
        meera.root.rotation.y = -0.4;
        stage.add(meera.root);
        anim.meera = meera;

        const rahul = CinematicCharacters.createRahul();
        rahul.root.position.set(-1.4, 0, 3.0);
        rahul.root.rotation.y = 0.4;
        stage.add(rahul.root);
        anim.rahul = rahul;
      },
      update: (progress, delta, elapsed, anim, cam) => {
        // Tracking medium shot moving with Yamini
        const zPos = 4.0 - progress * 4.5;
        if (anim.yamini) {
          anim.yamini.root.position.z = zPos;
        }

        cam.position.set(0, 151.65, zPos + 3.4);
        cam.lookAt(0, 151.35, zPos);

        const t = elapsed;
        anim.yamini?.update(t, delta, {
          isWalking: true,
          walkSpeed: 4.0,
          isTalking: Math.sin(elapsed * 2) > 0,
        });
        anim.meera?.update(t, delta, {
          isTalking: Math.sin(elapsed * 1.5) > 0,
          gesture: 'WAVE',
        });
        anim.rahul?.update(t, delta, {
          gesture: 'POINT',
        });
      },
    });

    // -------------------------------------------------------------
    // SCENE 4: TRUTH OR DARE
    // -------------------------------------------------------------
    this.scenes.push({
      title: 'SCENE 04 // THE GATHERING',
      theme: 'TRUTH_OR_DARE',
      duration: 10.5,
      lines: [
        {
          speaker: 'SANKAR',
          text: 'That evening, her friends gathered in a circle. The bottle spun...',
          start: 0.5,
          duration: 4.5,
        },
        {
          speaker: 'VIKRAM',
          text: '"Truth or Dare, Yamini? No backing out this time!"',
          start: 5.2,
          duration: 4.8,
        },
      ],
      setup: (stage, anim) => {
        CinematicEnvironments.buildTruthOrDareRoom(stage);

        const bottle = stage.getObjectByName('SPINNING_BOTTLE');
        anim.bottle = bottle;

        const yamini = CinematicCharacters.createYamini();
        yamini.root.position.set(0, 0, 1.6);
        yamini.root.rotation.y = Math.PI;
        stage.add(yamini.root);
        anim.yamini = yamini;

        const vikram = CinematicCharacters.createVikram();
        vikram.root.position.set(-1.6, 0, 0);
        vikram.root.rotation.y = Math.PI / 2;
        stage.add(vikram.root);
        anim.vikram = vikram;

        const meera = CinematicCharacters.createMeera();
        meera.root.position.set(1.6, 0, 0);
        meera.root.rotation.y = -Math.PI / 2;
        stage.add(meera.root);
        anim.meera = meera;

        horrorAudio.playBottleSpinAudio();
      },
      update: (progress, delta, elapsed, anim, cam) => {
        // High angle descending toward bottle and Yamini
        const startPos = new THREE.Vector3(0, 154.2, 2.5);
        const endPos = new THREE.Vector3(0, 152.1, 2.0);
        cam.position.lerpVectors(startPos, endPos, progress);
        cam.lookAt(0, 150.3, 0.4);

        // Spin bottle with physics deceleration
        if (anim.bottle) {
          const spinSpeed = Math.max(0, 24 * Math.exp(-elapsed * 0.45));
          anim.bottle.rotation.y += spinSpeed * delta;
        }

        const t = elapsed;
        anim.yamini?.update(t, delta, {
          isSitting: true,
          isTalking: elapsed > 7.5,
        });
        anim.vikram?.update(t, delta, {
          isSitting: true,
          isTalking: elapsed > 5.0 && elapsed < 7.5,
          gesture: 'CHALLENGE',
        });
        anim.meera?.update(t, delta, {
          isSitting: true,
        });
      },
    });

    // -------------------------------------------------------------
    // SCENE 5: THE DARE & THE RULES
    // -------------------------------------------------------------
    this.scenes.push({
      title: 'SCENE 05 // THE DARE',
      theme: 'RULES',
      duration: 11.0,
      lines: [
        {
          speaker: 'VIKRAM',
          text: 'Spend one full night inside the abandoned House of Devil.',
          start: 0.5,
          duration: 4.2,
        },
        {
          speaker: 'SANKAR',
          text: 'The rules were strict: No torch. No phone. Tell no one. Stay until morning.',
          start: 4.8,
          duration: 5.8,
        },
      ],
      setup: (stage, anim) => {
        CinematicEnvironments.buildTruthOrDareRoom(stage);

        const vikram = CinematicCharacters.createVikram();
        vikram.root.position.set(-0.8, 0, 0.5);
        vikram.root.rotation.y = 0.8;
        stage.add(vikram.root);
        anim.vikram = vikram;

        const yamini = CinematicCharacters.createYamini();
        yamini.root.position.set(0.8, 0, 0.5);
        yamini.root.rotation.y = -0.8;
        stage.add(yamini.root);
        anim.yamini = yamini;

        horrorAudio.playStoryRuleHit(1);
      },
      update: (progress, delta, elapsed, anim, cam) => {
        // Dramatic low angle side profile
        cam.position.set(-1.8 + progress * 0.5, 151.3, 2.2);
        cam.lookAt(0, 151.1, 0.5);

        const t = elapsed;
        anim.vikram?.update(t, delta, {
          isTalking: elapsed < 4.5,
          gesture: 'CHALLENGE',
        });
        anim.yamini?.update(t, delta, {
          gesture: 'NONE',
          lookTarget: anim.vikram?.root.position.clone().add(new THREE.Vector3(0, 1.4, 0)),
        });
      },
    });

    // -------------------------------------------------------------
    // SCENE 6: YAMINI ENTERS THE HAUNTED APPROACH
    // -------------------------------------------------------------
    this.scenes.push({
      title: 'SCENE 06 // APPROACHING DEVIL\'S BUNGALOW',
      theme: 'APPROACH',
      duration: 11.5,
      lines: [
        {
          speaker: 'SANKAR',
          text: 'She thought it was just a stupid college dare.',
          start: 0.5,
          duration: 4.2,
        },
        {
          speaker: 'SANKAR',
          text: 'Neither of us knew... that night would change everything.',
          start: 5.0,
          duration: 6.0,
        },
      ],
      setup: (stage, anim) => {
        CinematicEnvironments.buildHauntedApproach(stage);

        const yamini = CinematicCharacters.createYamini();
        yamini.root.position.set(0, 0, 0);
        yamini.root.rotation.y = Math.PI; // Walking away toward house
        stage.add(yamini.root);
        anim.yamini = yamini;

        horrorAudio.playDistantThunder();
      },
      update: (progress, delta, elapsed, anim, cam) => {
        // Yamini walking down the dark misty path
        const z = -progress * 22;
        if (anim.yamini) {
          anim.yamini.root.position.z = z;
        }

        // Camera tracks slowly behind her at shoulder height
        cam.position.set(0.5, 151.75, z + 4.8);
        cam.lookAt(0, 151.6, z - 8);

        const t = elapsed;
        anim.yamini?.update(t, delta, {
          isWalking: true,
          walkSpeed: 3.5,
        });
      },
    });

    // -------------------------------------------------------------
    // SCENE 7: YAMINI DISAPPEARS (DO NOT SHOW ENTITY)
    // -------------------------------------------------------------
    this.scenes.push({
      title: 'SCENE 07 // DISAPPEARANCE',
      theme: 'DISAPPEAR',
      duration: 11.0,
      lines: [
        {
          speaker: 'SANKAR',
          text: 'The heavy wooden doors slammed shut behind her into absolute darkness.',
          start: 0.5,
          duration: 5.0,
        },
        {
          speaker: 'SANKAR',
          text: 'Eerie silence consumed the grounds. Yamini... never walked back out.',
          start: 5.8,
          duration: 5.0,
        },
      ],
      setup: (stage, anim) => {
        CinematicEnvironments.buildMansionFoyer(stage);

        const doors = stage.getObjectByName('DOUBLE_DOORS');
        anim.doors = doors;

        horrorAudio.setPsychologicalSilence(true, 3.0);
        horrorAudio.playBungalowWindowCreak();

        setTimeout(() => {
          horrorAudio.playGateCreak(1.0);
          horrorAudio.playStoryHorrorSting();
        }, 3200);
      },
      update: (progress, delta, elapsed, anim, cam) => {
        // Slow push-in on the glowing dropped phone lying on wet porch
        const startPos = new THREE.Vector3(0, 152.2, 5.0);
        const endPos = new THREE.Vector3(0.35, 150.5, 0.4);
        cam.position.lerpVectors(startPos, endPos, progress);
        cam.lookAt(0.35, 150.05, -1.5);

        // Heavy door slam at elapsed = 3.2s
        if (anim.doors) {
          const doorL = anim.doors.getObjectByName('DOOR_LEFT');
          const doorR = anim.doors.getObjectByName('DOOR_RIGHT');
          if (elapsed > 3.2 && doorL && doorR) {
            doorL.rotation.y = 0;
            doorR.rotation.y = 0;
          } else if (doorL && doorR) {
            // slightly open prior
            doorL.rotation.y = -0.7;
            doorR.rotation.y = 0.7;
          }
        }
      },
    });

    // -------------------------------------------------------------
    // SCENE 8: SANKAR REALIZES YAMINI IS MISSING
    // -------------------------------------------------------------
    this.scenes.push({
      title: 'SCENE 08 // MORNING CALL',
      theme: 'SEARCH',
      duration: 10.5,
      lines: [
        {
          speaker: 'SANKAR',
          text: 'Morning arrived. 8:00 AM. Her breakfast sat cold on the table.',
          start: 0.5,
          duration: 4.8,
        },
        {
          speaker: 'SANKAR',
          text: 'The phone just rang and rang until the call failed. That was when terror set in.',
          start: 5.5,
          duration: 4.8,
        },
      ],
      setup: (stage, anim) => {
        CinematicEnvironments.buildMorningDiningTable(stage);

        const sankar = CinematicCharacters.createSankar();
        sankar.root.position.set(0, 0, 1.2);
        sankar.root.rotation.y = Math.PI;
        stage.add(sankar.root);
        anim.sankar = sankar;

        horrorAudio.playClockTickAudio();
      },
      update: (progress, delta, elapsed, anim, cam) => {
        // Rapid push-in to Sankar's rising dread
        const startPos = new THREE.Vector3(0, 151.9, 3.2);
        const endPos = new THREE.Vector3(0, 151.75, 1.9);
        cam.position.lerpVectors(startPos, endPos, Math.min(1.0, progress * 1.5));
        cam.lookAt(0, 151.7, 1.2);

        const t = elapsed;
        anim.sankar?.update(t, delta, {
          isTerrified: elapsed > 5.0,
          gesture: elapsed > 5.2 ? 'HOLD_HEAD' : 'NONE',
          isTalking: elapsed < 5.0,
        });
      },
    });

    // -------------------------------------------------------------
    // SCENE 9: SANKAR CONFRONTS THE FRIENDS
    // -------------------------------------------------------------
    this.scenes.push({
      title: 'SCENE 09 // THE CONFRONTATION',
      theme: 'CONFRONT',
      duration: 11.5,
      lines: [
        {
          speaker: 'SANKAR',
          text: '"Where is my sister?! What did you do to Yamini?!"',
          start: 0.5,
          duration: 4.5,
        },
        {
          speaker: 'MEERA',
          text: '"She took the dare... She went into the House of Devil... She never came out!"',
          start: 5.2,
          duration: 5.8,
        },
      ],
      setup: (stage, anim) => {
        CinematicEnvironments.buildCollegeCampus(stage);

        const sankar = CinematicCharacters.createSankar();
        sankar.root.position.set(-0.9, 0, 1.5);
        sankar.root.rotation.y = 0.8;
        stage.add(sankar.root);
        anim.sankar = sankar;

        const vikram = CinematicCharacters.createVikram();
        vikram.root.position.set(0.7, 0, 1.8);
        vikram.root.rotation.y = -0.8;
        stage.add(vikram.root);
        anim.vikram = vikram;

        const meera = CinematicCharacters.createMeera();
        meera.root.position.set(1.4, 0, 1.0);
        meera.root.rotation.y = -1.2;
        stage.add(meera.root);
        anim.meera = meera;
      },
      update: (progress, delta, elapsed, anim, cam) => {
        // Dutch angle tracking between Sankar and the trembling friends
        cam.position.set(-1.8, 151.65, 3.4 - progress * 1.2);
        cam.lookAt(0.2, 151.4, 1.5);

        const t = elapsed;
        anim.sankar?.update(t, delta, {
          isTalking: elapsed < 4.8,
          gesture: 'CHALLENGE',
        });
        anim.vikram?.update(t, delta, {
          isTerrified: true,
          gesture: 'NONE',
        });
        anim.meera?.update(t, delta, {
          isCrying: true,
          isTalking: elapsed > 5.2,
          gesture: 'HOLD_HEAD',
        });
      },
    });

    // -------------------------------------------------------------
    // SCENE 10: SANKAR'S VOW & SEAMLESS RETURN TO GAMEPLAY
    // -------------------------------------------------------------
    this.scenes.push({
      title: 'SCENE 10 // THE VOW',
      theme: 'DECISION',
      duration: 10.0,
      lines: [
        {
          speaker: 'SANKAR',
          text: 'No one who entered those grounds has ever returned.',
          start: 0.5,
          duration: 4.2,
        },
        {
          speaker: 'SANKAR',
          text: '"Yamini... I\'m coming."',
          start: 5.0,
          duration: 4.5,
        },
      ],
      setup: (stage, anim) => {
        // Stage directly in the real game world passage!
        const realWorld = this.scene;
        const playerPos = this.player.position.clone();

        const sankar = CinematicCharacters.createSankar();
        // Place Sankar 1.8m in front of player facing forward into the dark passage
        const forward = new THREE.Vector3(-Math.sin(this.player.cameraYaw), 0, -Math.cos(this.player.cameraYaw)).normalize();
        const sankarPos = playerPos.clone().add(forward.clone().multiplyScalar(1.8));
        sankarPos.y = 0;
        sankar.root.position.copy(sankarPos);
        sankar.root.lookAt(sankarPos.clone().add(forward));

        realWorld.add(sankar.root);
        anim.sankar = sankar;
        anim.realWorld = true;

        horrorAudio.setPsychologicalSilence(false, 1.2);
        horrorAudio.playStoryHorrorSting();
      },
      update: (progress, delta, elapsed, anim, cam) => {
        // Sankar stands tall, clenched fists, facing the dark house
        const playerPos = this.player.position.clone();
        const playerEyePos = playerPos.clone().add(new THREE.Vector3(0, 1.6, 0));
        const forward = new THREE.Vector3(-Math.sin(this.player.cameraYaw), 0, -Math.cos(this.player.cameraYaw)).normalize();

        // Over-the-shoulder angle at start, smoothly blending directly into player eye position at end!
        const otsPos = playerPos.clone().add(forward.clone().multiplyScalar(-1.5)).add(new THREE.Vector3(0.5, 1.8, 0));
        cam.position.lerpVectors(otsPos, playerEyePos, Math.pow(progress, 2.5));

        const targetLook = playerPos.clone().add(forward.clone().multiplyScalar(10));
        cam.lookAt(targetLook);

        const t = elapsed;
        anim.sankar?.update(t, delta, {
          isTalking: elapsed > 5.0 && elapsed < 8.0,
          gesture: 'CHALLENGE',
        });
      },
    });
  }

  // Speak narration aloud using Web Speech API synthesis
  private speakLine(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 0.95;

      // Select natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US')
      );
      if (preferred) {
        utterance.voice = preferred;
      }
      this.currentSpeechUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis fallback handled gracefully
    }
  }

  public startCinematic(): void {
    if (this.isActive) return;
    this.isActive = true;

    // 1. Save original player camera transform to restore perfectly after
    this.savedCameraPos.copy(this.camera.position);
    this.savedCameraRot.copy(this.camera.rotation);
    this.savedFov = this.camera.fov;

    // 2. Disable player controls
    this.player.setMenuMode(true);

    // 3. Audio score
    horrorAudio.playStoryModeScore('CHILDHOOD');

    // 4. Start at Scene 0
    this.currentSceneIdx = 0;
    this.sceneElapsed = 0;
    this.loadScene(0);
  }

  private loadScene(idx: number): void {
    if (idx >= this.scenes.length) {
      this.completeCinematic();
      return;
    }

    // Cleanup previous stage objects
    this.clearMemoryStage();

    this.currentSceneIdx = idx;
    this.sceneElapsed = 0;
    const sceneDef = this.scenes[idx];
    this.animData = {};

    // Trigger score theme
    const themeAudioMap: Record<string, 'INTRO' | 'CHILDHOOD' | 'RESPONSIBILITY' | 'COLLEGE' | 'TRUTH_OR_DARE' | 'RULES' | 'APPROACH' | 'DISAPPEAR' | 'SEARCH' | 'RESOLVE'> = {
      CHILDHOOD: 'CHILDHOOD',
      RESPONSIBILITY: 'RESPONSIBILITY',
      COLLEGE: 'COLLEGE',
      TRUTH_OR_DARE: 'TRUTH_OR_DARE',
      RULES: 'RULES',
      APPROACH: 'APPROACH',
      DISAPPEAR: 'DISAPPEAR',
      SEARCH: 'SEARCH',
      CONFRONT: 'SEARCH',
      DECISION: 'RESOLVE',
    };
    horrorAudio.playStoryModeScore(themeAudioMap[sceneDef.theme] || 'INTRO');

    const isRealWorld = idx === 9; // Scene 10 takes place in active gameplay world
    if (isRealWorld) {
      this.memoryStageGroup.visible = false;
      sceneDef.setup(this.memoryStageGroup, this.animData);
    } else {
      this.memoryStageGroup.visible = true;
      sceneDef.setup(this.memoryStageGroup, this.animData);
    }
  }

  public update(delta: number): void {
    if (!this.isActive) return;

    const sceneDef = this.scenes[this.currentSceneIdx];
    if (!sceneDef) {
      this.completeCinematic();
      return;
    }

    this.sceneElapsed += delta;
    const progress = Math.min(1.0, this.sceneElapsed / sceneDef.duration);

    // Call scene custom update
    sceneDef.update(progress, delta, this.sceneElapsed, this.animData, this.camera);

    // Subtitle & Speech line synchronization
    let activeLine: { speaker: string; text: string } | null = null;
    for (const line of sceneDef.lines) {
      if (this.sceneElapsed >= line.start && this.sceneElapsed < line.start + line.duration) {
        activeLine = line;
        break;
      }
    }

    if (activeLine) {
      const subData: StorySubtitleData = {
        speaker: activeLine.speaker,
        text: activeLine.text,
        sceneIndex: this.currentSceneIdx + 1,
        totalScenes: this.scenes.length,
        sceneTitle: sceneDef.title,
      };
      if (this.callbacks.onSubtitleChange) {
        this.callbacks.onSubtitleChange(subData);
      }
    } else {
      if (this.callbacks.onSubtitleChange) {
        this.callbacks.onSubtitleChange(null);
      }
    }

    // Check scene completion
    if (this.sceneElapsed >= sceneDef.duration) {
      this.loadScene(this.currentSceneIdx + 1);
    }
  }

  private clearMemoryStage(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Remove any real-world attached actors
    if (this.animData?.sankar && this.animData.realWorld) {
      this.scene.remove(this.animData.sankar.root);
    }

    while (this.memoryStageGroup.children.length > 0) {
      const child = this.memoryStageGroup.children[0];
      this.memoryStageGroup.remove(child);
      if ((child as any).geometry) {
        (child as any).geometry.dispose();
      }
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }
  }

  public skipCinematic(): void {
    this.completeCinematic();
  }

  public completeCinematic(): void {
    if (!this.isActive) return;
    this.isActive = false;

    this.clearMemoryStage();
    this.memoryStageGroup.visible = false;

    if (this.callbacks.onSubtitleChange) {
      this.callbacks.onSubtitleChange(null);
    }

    // Restore camera position and FOV
    this.camera.position.copy(this.savedCameraPos);
    this.camera.rotation.copy(this.savedCameraRot);
    this.camera.fov = this.savedFov;
    this.camera.updateProjectionMatrix();

    // Re-enable player movement controls
    this.player.setMenuMode(false);

    // Stop score and resume atmospheric wind/drone
    horrorAudio.playStoryModeScore('STOP');

    if (this.callbacks.onComplete) {
      this.callbacks.onComplete();
    }
  }

  public destroy(): void {
    this.clearMemoryStage();
    this.scene.remove(this.memoryStageGroup);
  }
}
