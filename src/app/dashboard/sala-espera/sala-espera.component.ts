// esperar-partida.component.ts (versión actualizada)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { PartidaService } from '../../core/services/partida.service';
import { CommonModule } from '@angular/common';

interface Partida {
  id: number;
  nombre: string;
  descripcion?: string;
}


interface FlashMessage {
  success?: string;
}

export interface EstadoPartida {
  estado: string;
  totalJugadores: number;
  puedeIniciar: boolean;
  debeRedirigir: boolean;
  urlRedireccion: string;
}

export interface EstadoPartida {
  estado: string;
  totalJugadores: number;
  puedeIniciar: boolean;
  debeRedirigir: boolean;
  urlRedireccion: string;
}

export interface EstadoPartidaResponse {
  success: boolean;
  data: EstadoPartida;
}

@Component({
  selector: 'app-esperar-partida',
  templateUrl: './sala-espera.component.html',
  styleUrls: ['./sala-espera.component.css'],
  imports: [CommonModule],
})
export class SalaEsperaComponent implements OnInit, OnDestroy {
  partida!: Partida;
  totalJugadores: number = 1;
  flash: FlashMessage = {};

  jugadoresActuales: number = 0;
  polling: boolean = true;
  isRedirecting: boolean = false;
  loading: boolean = true;

  private pollingSubscription?: Subscription;
  private redirectTimeout?: number;
  private partidaId!: number;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private partidaService: PartidaService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.partidaId = +params['id'];
      this.cargarPartida();
    });
  }

  ngOnDestroy(): void {
    this.polling = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  get statusMessage(): string {
    if (this.jugadoresActuales >= 2) {
      return '¡Jugador encontrado! Iniciando partida...';
    }
    return 'Esperando que otro jugador se una a la partida...';
  }

  get progressPercentage(): number {
    return (this.jugadoresActuales / 2) * 100;
  }

  private cargarPartida(): void {
    this.partidaService.obtenerPartida(this.partidaId).subscribe({
      next: (response) => {
        this.partida = response.partida;
        this.totalJugadores = response.totalJugadores;
        this.jugadoresActuales = response.totalJugadores;
        this.loading = false;
        this.iniciarPolling();
      },
      error: (error) => {
        console.error('Error al cargar la partida:', error);
        this.router.navigate(['/']);
      },
    });
  }

  private iniciarPolling(): void {
    this.pollingSubscription = interval(2000)
      .pipe(
        takeWhile(() => this.polling && !this.isRedirecting),
        switchMap(() => this.partidaService.verificarEstado(this.partidaId))
      )
      .subscribe({
        next: (response) => {
          const estado = response['data'];

          this.jugadoresActuales = estado.totalJugadores;

          if (estado.puedeIniciar && estado.estado === 'en_curso') {
            this.polling = false;
            this.isRedirecting = true;

            this.redirectTimeout = window.setTimeout(() => {
              this.router.navigate(['app/juego', this.partidaId]).then(() => {
                this.isRedirecting = false;
              });
            }, 2000);
          }
          console.log('Estado actual:', estado);
        },
        error: (error) => {
          console.error('Error al verificar estado:', error);
        },
      });
  }

  cancelar(): void {
    if (this.isRedirecting) return;

    this.polling = false;
    this.isRedirecting = true;

    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }

    this.partidaService.cancelarPartida(this.partidaId).subscribe({
      next: () => {
        this.isRedirecting = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error al cancelar partida:', error);
        this.isRedirecting = false;
      },
    });
  }
}
