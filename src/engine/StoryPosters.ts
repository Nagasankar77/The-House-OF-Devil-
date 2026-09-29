import * as THREE from 'three';
import { StoryPoster } from '../types';

export const STORY_POSTERS: StoryPoster[] = [
  {
    id: 'poster_1',
    type: 'POSTER_1',
    title: 'Journal Page — Arrival',
    subtitle: 'pinned with a rusted nail',
    date: 'Three weeks after the silence',
    body: [
      'I didn’t come here looking for the house.',
      'I came looking for someone.',
      'The letters stopped abruptly. No postmark, no farewell. Just silence.',
      'Then the nightmares started — the same wrought-iron gate, the same narrow passage in the freezing rain.',
      'Whoever or whatever is inside... knows I was on my way.'
    ],
    handwrittenNote: '“Follow the passage. Do not stop.”',
    hasPhoto: false,
  },
  {
    id: 'poster_2',
    type: 'POSTER_2',
    title: 'MISSING PERSON NOTICE',
    subtitle: 'torn police circular from county bulletin',
    date: 'OCTOBER 19, 1983',
    body: [
      'NAME: ELEANOR VANCE — AGE: 24',
      'Last witnessed near the Blackwood Estate perimeter in heavy downpour.',
      'Vehicle abandoned half a mile south with doors unlocked.',
      'Her personal diary was recovered at the crossroads inn. The final three entries were illegible scratches.',
      'NOTICE: Do not search the private grounds after dusk.'
    ],
    handwrittenNote: 'Beneath the photo, in hurried charcoal: “She walked through the gate alone.”',
    hasPhoto: true,
    photoCaption: 'Eleanor Vance — Taken two months prior to disappearance',
  },
  {
    id: 'poster_3',
    type: 'POSTER_3',
    title: 'OLD HANDWRITTEN WARNING',
    subtitle: 'brittle parchment scorched at the margins',
    date: 'Date illegible — faded ink',
    body: [
      'DO NOT ENTER AFTER DARK.',
      'THE HOUSE REMEMBERS.',
      'It feeds on what you try to forget. The rooms rearrange in the dark.',
      'If you hear your own voice calling from the veranda, do not answer.',
      'Turn back while your name still belongs to you.'
    ],
    handwrittenNote: 'Scratched into the bottom: “Too late for us.”',
    hasPhoto: false,
  },
  {
    id: 'poster_4',
    type: 'POSTER_4',
    title: 'DAMAGED ESTATE PHOTOGRAPH',
    subtitle: 'silver-gelatin print with chemical scratches',
    date: 'AUTUMN 1952',
    body: [
      'An old black-and-white photograph of the Haunted Bungalow taken decades ago.',
      'A family stands formally upon the veranda steps in colonial attire.',
      'A tall man in a dark coat, a woman holding a parasol, and two young children.',
      'The faces of the woman and the younger child have been violently scratched out with a blade.',
      'The house behind them looks pristine, with all lamps brightly lit.'
    ],
    handwrittenNote: 'Scribbled on the photographic border: “Who are these people? Why does this place feel familiar?”',
    hasPhoto: true,
    photoCaption: 'Blackwood Bungalow — Family portrait, 1952 [Faces gouged]',
  },
  {
    id: 'poster_5',
    type: 'POSTER_5',
    title: 'PERSONAL CONNECTION — TORN RECORD',
    subtitle: 'crumpled page torn from an estate ledger',
    date: 'November 1989',
    body: [
      'YOU HAVE BEEN HERE BEFORE.',
      'The brass key did not come to your hands by chance.',
      'Look at the veranda steps ahead. You counted all five of them every night when you were young.',
      'The fire did not destroy the memories — it buried them here.',
      'The house was never abandoned. It was waiting for you to return.'
    ],
    handwrittenNote: 'A faint pencil sketch of a child clutching the iron gate key is drawn below.',
    hasPhoto: false,
  },
];

/**
 * Procedurally draws rich, weathered 2D canvas textures for posters in the 3D scene.
 */
export function generatePosterCanvasTexture(poster: StoryPoster): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Aged Parchment Background with subtle yellowing & damp gradients
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 720);
  if (poster.type === 'POSTER_3') {
    bgGrad.addColorStop(0, '#c7b28a');
    bgGrad.addColorStop(0.5, '#b0996c');
    bgGrad.addColorStop(1, '#8e774d');
  } else if (poster.type === 'POSTER_4') {
    bgGrad.addColorStop(0, '#cfc8be');
    bgGrad.addColorStop(0.6, '#b8b0a2');
    bgGrad.addColorStop(1, '#948b7d');
  } else {
    bgGrad.addColorStop(0, '#e2d6be');
    bgGrad.addColorStop(0.5, '#d3c4a5');
    bgGrad.addColorStop(1, '#b8a682');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 720);

  // 2. Weather stains & dark vignetting along edges
  for (let s = 0; s < 18; s++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 720;
    const rrad = 30 + Math.random() * 75;
    const stainGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rrad);
    stainGrad.addColorStop(0, 'rgba(80, 55, 30, 0.12)');
    stainGrad.addColorStop(1, 'rgba(60, 40, 20, 0)');
    ctx.fillStyle = stainGrad;
    ctx.beginPath();
    ctx.arc(rx, ry, rrad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark burnt/damp edge border
  ctx.strokeStyle = 'rgba(60, 42, 25, 0.45)';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 498, 706);

  // 3. Render specific poster graphics
  if (poster.type === 'POSTER_2') {
    // Missing Person layout
    ctx.fillStyle = '#1c150e';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('MISSING PERSON', 256, 68);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#6e1e18';
    ctx.fillText('COUNTY POLICE NOTICE', 256, 96);

    // Vintage Sepia Photo Frame
    ctx.fillStyle = '#2a221b';
    ctx.fillRect(146, 115, 220, 240);
    ctx.fillStyle = '#a6957a';
    ctx.fillRect(152, 121, 208, 228);

    // Stylized silhouette portrait
    ctx.fillStyle = '#322820';
    ctx.beginPath();
    ctx.arc(256, 195, 45, 0, Math.PI * 2); // head
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(256, 290, 75, 60, 0, 0, Math.PI, true); // shoulders
    ctx.fill();

    // Photo scratches & film grain
    ctx.strokeStyle = 'rgba(240, 230, 210, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(170, 140);
    ctx.lineTo(320, 310);
    ctx.moveTo(210, 130);
    ctx.lineTo(220, 330);
    ctx.stroke();

    // Details text
    ctx.fillStyle = '#1e1914';
    ctx.font = 'bold 22px serif';
    ctx.fillText('ELEANOR VANCE', 256, 395);

    ctx.font = 'italic 16px serif';
    ctx.fillStyle = '#4a3d31';
    ctx.fillText('Last seen near Blackwood Estate road', 256, 422);
    ctx.fillText('October 19, 1983', 256, 446);

    ctx.font = '15px monospace';
    ctx.fillStyle = '#2d2218';
    ctx.textAlign = 'left';
    ctx.fillText('• 5 ft 6 in, dark wool overcoat', 70, 500);
    ctx.fillText('• Left personal diary behind', 70, 532);
    ctx.fillText('• If located: DO NOT ENTER ALONE', 70, 564);

    ctx.fillStyle = '#8a221a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('“She walked through the gate alone.”', 256, 645);

  } else if (poster.type === 'POSTER_4') {
    // Old Damaged Photograph Layout
    ctx.fillStyle = '#1c1611';
    ctx.font = 'italic 20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Blackwood Bungalow — Autumn 1952', 256, 55);

    // Photo paper mount
    ctx.fillStyle = '#1e1c1a';
    ctx.fillRect(56, 80, 400, 480);
    ctx.fillStyle = '#a89f92';
    ctx.fillRect(66, 90, 380, 460);

    // Draw stylized haunted bungalow silhouette in photo
    ctx.fillStyle = '#4a443b';
    ctx.fillRect(100, 260, 312, 180); // main house
    ctx.beginPath();
    ctx.moveTo(80, 260);
    ctx.lineTo(256, 150);
    ctx.lineTo(432, 260);
    ctx.fill(); // roof

    // Veranda pillars
    ctx.fillStyle = '#877c6c';
    for (let p = 120; p <= 390; p += 45) {
      ctx.fillRect(p, 340, 10, 100);
    }

    // Figures standing on veranda
    ctx.fillStyle = '#221e19';
    // Tall figure 1
    ctx.fillRect(180, 360, 16, 65);
    ctx.beginPath();
    ctx.arc(188, 350, 10, 0, Math.PI * 2);
    ctx.fill();
    // Figure 2 (woman)
    ctx.fillRect(230, 370, 18, 55);
    ctx.beginPath();
    ctx.arc(239, 362, 9, 0, Math.PI * 2);
    ctx.fill();
    // Figure 3 (child)
    ctx.fillRect(285, 395, 14, 30);
    ctx.beginPath();
    ctx.arc(292, 390, 7, 0, Math.PI * 2);
    ctx.fill();

    // VIOLENT KNIFE SCRATCHES across the faces
    ctx.strokeStyle = '#e6ddcc';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      ctx.moveTo(215 + Math.random() * 45, 345 + Math.random() * 30);
      ctx.lineTo(245 + Math.random() * 35, 365 + Math.random() * 25);
    }
    ctx.stroke();

    ctx.fillStyle = '#251e18';
    ctx.font = 'italic 18px serif';
    ctx.textAlign = 'center';
    ctx.fillText('“Who are these people?”', 256, 605);
    ctx.font = '15px serif';
    ctx.fillStyle = '#5c4e3f';
    ctx.fillText('Why does this place feel familiar?', 256, 640);

  } else if (poster.type === 'POSTER_3') {
    // Frantic Warning
    ctx.fillStyle = '#5a120c';
    ctx.font = 'bold 38px serif';
    ctx.textAlign = 'center';
    ctx.fillText('DO NOT ENTER', 256, 120);
    ctx.fillText('AFTER DARK', 256, 175);

    ctx.strokeStyle = '#5a120c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(80, 205);
    ctx.lineTo(432, 205);
    ctx.stroke();

    ctx.fillStyle = '#221914';
    ctx.font = 'italic bold 28px serif';
    ctx.fillText('THE HOUSE REMEMBERS.', 256, 270);

    ctx.font = '19px serif';
    ctx.fillStyle = '#3a2d22';
    ctx.fillText('Those who cross the threshold', 256, 350);
    ctx.fillText('do not leave as they arrived.', 256, 385);
    ctx.fillText('The walls hold what came before.', 256, 420);

    ctx.fillStyle = '#6a2018';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('TURN BACK.', 256, 520);

    ctx.font = 'italic 16px serif';
    ctx.fillStyle = '#4a3d31';
    ctx.fillText('— written in fading charcoal —', 256, 640);

  } else if (poster.type === 'POSTER_1') {
    // Arrival Note
    ctx.fillStyle = '#261e16';
    ctx.font = 'italic bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('OCTOBER 1983', 256, 90);

    ctx.font = '22px serif';
    ctx.textAlign = 'left';
    const lines = [
      '“I didn’t come here looking',
      ' for the house.',
      '',
      ' I came looking for someone.',
      '',
      ' The letters stopped three',
      ' weeks ago.',
      '',
      ' Whatever took her is still',
      ' inside these grounds.”'
    ];
    let y = 180;
    lines.forEach((l) => {
      ctx.fillText(l, 85, y);
      y += 38;
    });

    ctx.fillStyle = '#7a2820';
    ctx.font = 'italic 17px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('— Pinned to the mortar with an old nail —', 256, 645);

  } else {
    // POSTER_5 — Connection
    ctx.fillStyle = '#1e1711';
    ctx.font = 'bold 28px serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESTATE TRANSCRIPT', 256, 85);

    ctx.fillStyle = '#6a1812';
    ctx.font = 'bold 30px serif';
    ctx.fillText('YOU HAVE BEEN HERE BEFORE.', 256, 175);

    ctx.fillStyle = '#281f18';
    ctx.font = '19px serif';
    ctx.textAlign = 'left';
    ctx.fillText('The brass key did not come to your', 75, 260);
    ctx.fillText('hands by accident.', 75, 292);
    ctx.fillText('Look at the veranda steps ahead.', 75, 345);
    ctx.fillText('You counted all five of them', 75, 377);
    ctx.fillText('every night before the fire.', 75, 409);

    // Sketch of child holding ornate key
    ctx.strokeStyle = '#4a3b2f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(256, 500, 18, 0, Math.PI * 2); // head
    ctx.moveTo(256, 518);
    ctx.lineTo(256, 560); // body
    ctx.moveTo(256, 532);
    ctx.lineTo(235, 545); // left arm
    ctx.moveTo(256, 532);
    ctx.lineTo(285, 542); // right arm holding key
    // key shape
    ctx.arc(295, 542, 6, 0, Math.PI * 2);
    ctx.moveTo(301, 542);
    ctx.lineTo(315, 542);
    ctx.moveTo(312, 542);
    ctx.lineTo(312, 548);
    ctx.stroke();

    ctx.fillStyle = '#5c4837';
    ctx.font = 'italic 16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('“It is time to remember why you fled.”', 256, 645);
  }

  // Top pin/nail hole
  ctx.fillStyle = '#1a140f';
  ctx.beginPath();
  ctx.arc(256, 18, 5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}
