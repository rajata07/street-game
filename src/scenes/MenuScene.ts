import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { GAME_HEIGHT, GAME_WIDTH } from '../core/config';
import { HighScoreStore } from '../core/highscore';
import { StreetBackground } from '../entities/StreetBackground';

export class MenuScene extends Phaser.Scene {
  private background!: StreetBackground;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.background = new StreetBackground(this);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0);

    const cx = GAME_WIDTH / 2;
    this.add
      .text(cx, 190, 'GALI RUNNER', {
        fontFamily: 'Impact, sans-serif',
        fontSize: '64px',
        color: '#ffd23f',
        stroke: '#c1121f',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 262, 'Bhaiya, side de!', {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const emojis = this.add.text(cx, 340, '🛺 🚌 🛵 🐄 🚲', { fontSize: '40px' }).setOrigin(0.5);
    this.tweens.add({ targets: emojis, y: 352, yoyo: true, repeat: -1, duration: 600 });

    const best = new HighScoreStore(safeStorage()).get();
    this.add
      .text(cx, 430, `Best: ${best}`, {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#9be564',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(cx, 540, 'Tap or press SPACE to start', {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, yoyo: true, repeat: -1, duration: 700 });

    this.add
      .text(
        cx,
        660,
        '← → / A D or tap left & right: switch lanes\nGrab ☕ chai for points\nP: pause    M: mute',
        {
          fontFamily: 'sans-serif',
          fontSize: '16px',
          color: '#dddddd',
          align: 'center',
          lineSpacing: 6,
        },
      )
      .setOrigin(0.5);

    const start = () => {
      sfx.unlock();
      sfx.horn();
      this.scene.start('GameScene');
    };
    this.input.keyboard?.on('keydown-SPACE', start);
    this.input.keyboard?.on('keydown-ENTER', start);
    this.input.once('pointerdown', start);
  }

  update(_time: number, delta: number): void {
    this.background.scroll(0.15 * delta);
  }
}

export function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
