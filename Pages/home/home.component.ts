import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamesService, Game } from '../../Services';
import { LicenseService } from '../../Services/license.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  filteredGames$ = new BehaviorSubject<Game[]>([]);
  private subscriptions: Subscription[] = [];

  constructor(
    private gamesService: GamesService,
    private licenseService: LicenseService
  ) {}

  ngOnInit(): void {
    // Filter games based on license access
    const subscription = this.gamesService.getGames$().pipe(
      map(games => games.filter(game => this.licenseService.hasGameAccess(game.id)))
    ).subscribe(filteredGames => {
      this.filteredGames$.next(filteredGames);
    });

    this.subscriptions.push(subscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  trackByGameId(_: number, game: Game): string {
    return game.id;
  }
}
