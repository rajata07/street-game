import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { GAME_HEIGHT, GAME_WIDTH, PLAYER_Y, roadLaneCenterX } from '../core/config';
import { HighScoreStore } from '../core/highscore';
import type { WorldEvent } from '../core/types';
import { World } from '../core/world';
import { StreetBackground } from '../entities/StreetBackground';
import { safeStorage } from './MenuScene';

const RESTART_DELAY_MS = 600;
const HONK_WORDS = ['POM!', 'PEEP!', 'TRING!', 'PAAAP!', 'HORN OK PLEASE'];

interface Renderable {
  uid: number;
  x: number;
  y: number;
  emoji: string;
  fontSize: number;
}

export class GameScene extends Phaser.Scene {
  private world!: World;
  private background!: StreetBackground;
  private store = new HighScoreStore(safeStorage());
  private sprites = new Map<number, Phaser.GameObjects.Text>();
  private player!: Phaser.GameObjects.Text;
  private dog!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private caption!: Phaser.GameObjects.Text;
  private pausedText!: Phaser.GameObjects.Text;
  private paused = false;
  private canRestart = false;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.sprites.clear();
    this.paused = false;
    this.canRestart = false;
    this.world = new World((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
    this.background = new StreetBackground(this);

    this.player = this.add
      .text(this.world.playerX, PLAYER_Y, '🏃', { fontSize: '48px' })
      .setOrigin(0.5)
      .setDepth(10);
    this.dog = this.add
      .text(0, 0, '🐕', { fontSize: '36px' })
      .setOrigin(0.5)
      .setDepth(9)
      .setVisible(false);

    const hud = {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    };
    this.scoreText = this.add.text(12, 10, 'Score: 0', hud).setDepth(20);
    this.add
      .text(GAME_WIDTH - 12, 10, `Best: ${this.store.get()}`, hud)
      .setOrigin(1, 0)
      .setDepth(20);
    this.caption = this.add
      .text(GAME_WIDTH / 2, 90, '', {
        ...hud,
        fontSize: '24px',
        color: '#ffd23f',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 40 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);
    this.pausedText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSED\nPress P to resume', {
        ...hud,
        fontSize: '36px',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setVisible(false);

    this.bindInput();
    this.showCaption('Bhaiya, side de!');
  }

  update(_time: number, delta: number): void {
    if (this.paused) return;
    const world = this.world;

    if (world.status === 'running') {
      world.update(delta / 1000);
      this.background.scroll(world.speed * Math.min(delta / 1000, 0.05));
    }

    this.syncSprites([...world.obstacles, ...world.pickups]);
    this.updatePlayer();
    this.handleEvents(world.takeEvents());
    this.scoreText.setText(`Score: ${world.score}${world.multiplier > 1 ? '  x2' : ''}`);
  }

  private bindInput(): void {
    const kb = this.input.keyboard;
    const left = () => this.steer(-1);
    const right = () => this.steer(1);
    kb?.on('keydown-LEFT', left);
    kb?.on('keydown-A', left);
    kb?.on('keydown-RIGHT', right);
    kb?.on('keydown-D', right);
    kb?.on('keydown-P', () => this.togglePause());
    kb?.on('keydown-ESC', () => this.togglePause());
    kb?.on('keydown-M', () => this.showCaption(sfx.toggleMute() ? 'Sound off' : 'Sound on'));
    kb?.on('keydown-SPACE', () => this.restart());
    kb?.on('keydown-ENTER', () => this.restart());

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      sfx.unlock();
      if (this.world.status === 'over') {
        this.restart();
      } else if (!this.paused) {
        this.steer(pointer.x < GAME_WIDTH / 2 ? -1 : 1);
      }
    });
  }

  private steer(direction: -1 | 1): void {
    if (this.paused) return;
    sfx.unlock();
    this.world.moveLane(direction);
  }

  private togglePause(): void {
    if (this.world.status !== 'running') return;
    this.paused = !this.paused;
    this.pausedText.setVisible(this.paused);
  }

  private restart(): void {
    if (this.world.status === 'over' && this.canRestart) this.scene.restart();
  }

  private syncSprites(items: Renderable[]): void {
    const alive = new Set<number>();
    for (const item of items) {
      alive.add(item.uid);
      let sprite = this.sprites.get(item.uid);
      if (!sprite) {
        sprite = this.add
          .text(0, 0, item.emoji, { fontSize: `${item.fontSize}px` })
          .setOrigin(0.5)
          .setDepth(5);
        this.sprites.set(item.uid, sprite);
      }
      sprite.setPosition(item.x, item.y);
    }
    for (const [uid, sprite] of this.sprites) {
      if (!alive.has(uid)) {
        sprite.destroy();
        this.sprites.delete(uid);
      }
    }
  }

  private updatePlayer(): void {
    const world = this.world;
    const bob = world.status === 'running' ? Math.sin(world.time * 18) * 3 : 0;
    this.player.setPosition(world.playerX, PLAYER_Y + bob);
    this.player.setAngle(
      Phaser.Math.Clamp((world.playerX - roadLaneCenterX(world.playerLane)) * 0.25, -15, 15),
    );

    const dogActive = world.status === 'running' && world.multiplier > 1;
    this.dog.setVisible(dogActive);
    if (dogActive) {
      this.dog.setPosition(world.playerX, PLAYER_Y + 70 + Math.sin(world.time * 22) * 6);
    }
  }

  private handleEvents(events: WorldEvent[]): void {
    for (const event of events) {
      switch (event.kind) {
        case 'lane':
          sfx.step();
          break;
        case 'pickup':
          sfx.pickup();
          this.floatText(event.x, event.y, `+${event.points}`, '#9be564');
          break;
        case 'event':
          this.showCaption(event.caption);
          if (event.id === 'honk_chorus') this.honkChorus();
          else if (event.id === 'wedding_band' || event.id === 'cow_crossing') sfx.horn();
          break;
        case 'crash':
          this.gameOver(event.line);
          break;
      }
    }
  }

  private honkChorus(): void {
    sfx.chorus();
    this.cameras.main.shake(500, 0.004);
    for (let i = 0; i < 5; i++) {
      const word = HONK_WORDS[Math.floor(Math.random() * HONK_WORDS.length)];
      this.floatText(60 + Math.random() * 360, 180 + Math.random() * 300, word, '#ff9f1c');
    }
  }

  private showCaption(text: string): void {
    this.caption.setText(text).setAlpha(1);
    this.tweens.killTweensOf(this.caption);
    this.tweens.add({ targets: this.caption, alpha: 0, delay: 1800, duration: 600 });
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color,
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(25);
    this.tweens.add({
      targets: label,
      y: y - 60,
      alpha: 0,
      duration: 900,
      onComplete: () => label.destroy(),
    });
  }

  private gameOver(line: string): void {
    sfx.crash();
    this.cameras.main.shake(400, 0.012);
    this.cameras.main.flash(200, 255, 80, 80);
    this.player.setText('💫');
    this.dog.setVisible(false);

    const score = this.world.score;
    const record = this.store.submit(score);
    const cx = GAME_WIDTH / 2;
    const style = {
      fontFamily: 'sans-serif',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 5,
    };

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65).setOrigin(0).setDepth(40);
    this.add
      .text(cx, 230, 'GAME OVER', {
        ...style,
        fontFamily: 'Impact, sans-serif',
        fontSize: '60px',
        color: '#ff4d4d',
      })
      .setOrigin(0.5)
      .setDepth(41);
    this.add
      .text(cx, 320, line, {
        ...style,
        fontSize: '22px',
        color: '#ffd23f',
        wordWrap: { width: GAME_WIDTH - 60 },
      })
      .setOrigin(0.5)
      .setDepth(41);
    this.add
      .text(cx, 420, `Score: ${score}`, { ...style, fontSize: '34px' })
      .setOrigin(0.5)
      .setDepth(41);
    this.add
      .text(cx, 470, record ? 'NEW BEST!' : `Best: ${this.store.get()}`, {
        ...style,
        fontSize: '24px',
        color: '#9be564',
      })
      .setOrigin(0.5)
      .setDepth(41);

    this.time.delayedCall(RESTART_DELAY_MS, () => {
      this.canRestart = true;
      const prompt = this.add
        .text(cx, 570, 'Tap or press SPACE to retry', { ...style, fontSize: '24px' })
        .setOrigin(0.5)
        .setDepth(41);
      this.tweens.add({ targets: prompt, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 });
    });
  }
}
