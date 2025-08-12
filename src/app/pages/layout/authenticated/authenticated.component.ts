
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../../core/services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './authenticated.component.html',
  styleUrls: ['./authenticated.component.css'],
  imports: [RouterModule]
})
export class authenticatedComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isSidebarOpen = false;
  private userSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userSubscription = this.authService.getCurrentUser$().subscribe(
      user => {
        this.currentUser = user;
      }
    );
  }

    ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }

  toggleSidebar() {
     if (!this.isDesktop()) {
      this.isSidebarOpen = !this.isSidebarOpen;
    }
  }

  isDesktop(): boolean {
    return window.innerWidth >= 768;
    
  }


  goToPartidas() {
    this.router.navigate(['/app/mis-partidas']);
    if (!this.isDesktop()) {
      this.isSidebarOpen = false;
    }
  }

  
  navigateTo(route: string) {
    this.router.navigate([route]);
    if (!this.isDesktop()) {
      this.isSidebarOpen = false;
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.clear();
      },
      error: () => {
        localStorage.clear();
      }
    });
  }
}