import Phaser from 'phaser';
import { GAME_HEIGHT, ROAD_LEFT, ROAD_WIDTH } from '../core/config';

export const ROAD_TEXTURE = 'road';
const SHOP_NAMES = [
  'SHARMA JI CHAI',
  'PAPPU PAN SHOP',
  'VADA PAV CENTER',
  'JUGAAD GARAGE',
  'GUPTA SWEETS',
  'RAJU TAILORS',
  'MOBILE REPAIR',
  'LASSI CORNER',
  'GOLGAPPA ZONE',
  'BHAI KA DHABA',
];
const SHOP_COLORS = [0xe4572e, 0xf3a712, 0x29bf12, 0x2e86ab, 0xa23b72, 0x6a4c93];
const SHOP_SPACING = 100;

export function randomShopName(): string {
  return SHOP_NAMES[Math.floor(Math.random() * SHOP_NAMES.length)];
}

/** Generates the shared road texture; call once from BootScene. */
export function createRoadTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x3b3b3f, 1).fillRect(0, 0, ROAD_WIDTH, 160);
  g.fillStyle(0xf2f2f2, 0.9);
  for (const x of [ROAD_WIDTH / 3, (ROAD_WIDTH * 2) / 3]) g.fillRect(x - 3, 20, 6, 60);
  g.generateTexture(ROAD_TEXTURE, ROAD_WIDTH, 160);
  g.destroy();
}

/** Scrolling road, sidewalks and shop signs. */
export class StreetBackground {
  private road: Phaser.GameObjects.TileSprite;
  private shops: { box: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text }[] = [];
  private loopHeight: number;

  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(0, 0, ROAD_LEFT, GAME_HEIGHT, 0x8d7b68).setOrigin(0);
    scene.add.rectangle(ROAD_LEFT + ROAD_WIDTH, 0, ROAD_LEFT, GAME_HEIGHT, 0x8d7b68).setOrigin(0);
    this.road = scene.add
      .tileSprite(ROAD_LEFT, 0, ROAD_WIDTH, GAME_HEIGHT, ROAD_TEXTURE)
      .setOrigin(0);

    const rows = Math.ceil(GAME_HEIGHT / SHOP_SPACING) + 2;
    this.loopHeight = rows * SHOP_SPACING;
    for (const side of [0, 1]) {
      for (let i = 0; i < rows; i++) {
        const color = SHOP_COLORS[(i + side * 3) % SHOP_COLORS.length];
        const bg = scene.add.rectangle(0, 0, 52, 84, color).setStrokeStyle(2, 0x222222);
        const label = scene.add
          .text(0, 0, randomShopName(), {
            fontFamily: 'sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#ffffff',
          })
          .setOrigin(0.5)
          .setAngle(side === 0 ? -90 : 90);
        const x = side === 0 ? ROAD_LEFT / 2 : ROAD_LEFT + ROAD_WIDTH + ROAD_LEFT / 2;
        const box = scene.add.container(x, i * SHOP_SPACING - SHOP_SPACING, [bg, label]);
        this.shops.push({ box, label });
      }
    }
  }

  scroll(dy: number): void {
    this.road.tilePositionY -= dy;
    for (const shop of this.shops) {
      shop.box.y += dy;
      if (shop.box.y > GAME_HEIGHT + SHOP_SPACING / 2) {
        shop.box.y -= this.loopHeight;
        shop.label.setText(randomShopName());
      }
    }
  }
}
