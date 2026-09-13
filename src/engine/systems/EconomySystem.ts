/**
 * EconomySystem.ts
 * Manages player currency (gold), score, and base health lives.
 * Independent of React, exposing a subscription callback for state changes.
 */

export type EconomyChangeListener = () => void;
export type GameOverCallback = () => void;

export class EconomySystem {
  private currency: number;
  private score: number;
  private lives: number;
  private maxLives: number;

  private listeners: Set<EconomyChangeListener> = new Set();
  public onGameOver?: GameOverCallback;

  constructor(initialCurrency: number = 350, initialLives: number = 20) {
    this.currency = initialCurrency;
    this.lives = initialLives;
    this.maxLives = initialLives;
    this.score = 0;
  }

  public reset(currency: number = 350, lives: number = 20): void {
    this.currency = currency;
    this.lives = lives;
    this.maxLives = lives;
    this.score = 0;
    this.notify();
  }

  public getCurrency(): number {
    return this.currency;
  }

  public getScore(): number {
    return this.score;
  }

  public getLives(): number {
    return this.lives;
  }

  public addCurrency(amount: number): void {
    if (amount <= 0) return;
    this.currency += amount;
    this.notify();
  }

  public spendCurrency(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.currency < amount) {
      return false;
    }
    this.currency -= amount;
    this.notify();
    return true;
  }

  public addScore(points: number): void {
    if (points <= 0) return;
    this.score += points;
    this.notify();
  }

  public damageBase(damage: number = 1): void {
    if (damage <= 0 || this.lives <= 0) return;
    this.lives = Math.max(0, this.lives - damage);
    this.notify();

    if (this.lives === 0 && this.onGameOver) {
      this.onGameOver();
    }
  }

  public subscribe(listener: EconomyChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
