import Phaser from 'phaser';
import { createRoadTexture } from '../entities/StreetBackground';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    createRoadTexture(this);
    this.scene.start('MenuScene');
  }
}
