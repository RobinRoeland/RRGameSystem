import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-game.component.html',
  styleUrl: './test-game.component.scss'
})
export class TestGameComponent {
  currentScore = 0;
  gameStarted = false;

  startGame(): void {
    this.gameStarted = true;
    this.currentScore = 0;
  }

  incrementScore(): void {
    this.currentScore += 10;
  }

  resetGame(): void {
    this.gameStarted = false;
    this.currentScore = 0;
  }
}
