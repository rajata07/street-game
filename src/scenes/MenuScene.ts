import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { GAME_HEIGHT, GAME_WIDTH } from '../core/config';
import { HighScoreStore } from '../core/highscore';
import { getPlayerFace, PLAYER_FACES, setPlayerFace } from '../core/player';
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
      .text(cx, 190, 'Fancy Game', {
        fontFamily: 'Impact, sans-serif',
        fontSize: '64px',
        color: '#ffd23f',
        stroke: '#c1121f',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 255, 'Bhaiya, side de!', {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const emojis = this.add.text(cx, 320, '🛺 🚌 🛵 🐄 🚲', { fontSize: '40px' }).setOrigin(0.5);
    this.tweens.add({ targets: emojis, y: 332, yoyo: true, repeat: -1, duration: 600 });

    const best = new HighScoreStore(safeStorage()).get();
    this.add
      .text(cx, 385, `Best: ${best}`, {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#9be564',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 438, 'Choose your face', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    const storage = safeStorage();
    let selectedFace = getPlayerFace(storage);
    const faceButtons: Phaser.GameObjects.Rectangle[] = [];
    PLAYER_FACES.forEach((face, index) => {
      const x = cx + (index - (PLAYER_FACES.length - 1) / 2) * 58;
      const button = this.add
        .rectangle(x, 490, 52, 58, 0x222222, 0.9)
        .setStrokeStyle(face === selectedFace ? 3 : 1, face === selectedFace ? 0xffd23f : 0xaaaaaa)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, 490, face, { fontSize: '34px' }).setOrigin(0.5);
      faceButtons.push(button);
      button.on('pointerdown', () => {
        selectedFace = face;
        setPlayerFace(storage, selectedFace);
        faceButtons.forEach((faceButton, buttonIndex) =>
          faceButton.setStrokeStyle(
            PLAYER_FACES[buttonIndex] === selectedFace ? 3 : 1,
            PLAYER_FACES[buttonIndex] === selectedFace ? 0xffd23f : 0xaaaaaa,
          ),
        );
      });
    });

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
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y >= 525) start();
    });
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
