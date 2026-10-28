import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../core/config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Gali Runner\nBhaiya, side de!', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffd23f',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
