import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PartidaService } from '../../core/services/partida.service';
import { CommonModule } from '@angular/common';

interface Partida {
  id: number;
  nombre: string;
  oponente: string;
  estado: 'en_curso' | 'finalizada' | 'esperando';
  resultado: 'Ganada' | 'Perdida' | null;
  createdAt: string;
}

@Component({
  selector: 'app-mis-partidas',
  imports: [CommonModule],
  templateUrl: './mis-partidas.component.html',
  styleUrls: ['./mis-partidas.component.css']
})
export class MisPartidasComponent implements OnInit {
  partidas: Partida[] = [];
  loading = false;
  error: string | null = null;
  filtro: 'Ganada' | 'Perdida' | '' = ''; // filtro opcional

  constructor(
    private partidaService: PartidaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Leer filtro desde query params
    this.route.queryParams.subscribe(params => {
      this.filtro = params['filtro'] || '';
      this.cargarPartidas();
    });
  }

  cargarPartidas(): void {
    this.loading = true;
    this.error = null;

    if (this.filtro === 'Ganada' || this.filtro === 'Perdida') {
      
      const tipo = this.filtro === 'Ganada' ? 'ganadas' : 'perdidas';
      this.partidaService.getPartidasFiltradas(tipo).subscribe({
        next: (response) => {
          if (response.success) {
            this.partidas = response.partidas.map(partida => ({
              id: partida.id,
              nombre: partida.nombre,
              oponente: partida.oponente,
              estado: this.normalizarEstado(partida.estado),
              resultado: partida.resultado,
              createdAt: partida.created_at,
            }));
          } else {
            this.error = 'Error al cargar las partidas filtradas';
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error de conexión al cargar partidas filtradas';
          console.error('Error al cargar partidas filtradas:', error);
          this.loading = false;
        }
      });
    } else {
    
      this.partidaService.getMisPartidas().subscribe({
        next: (response) => {
          if (response.success) {
            this.partidas = response.data.map(partida => ({
              id: partida.id,
              nombre: partida.nombre,
              oponente: partida.oponente,
              estado: this.normalizarEstado(partida.estado),
              resultado: partida.resultado,
              createdAt: partida.createdAt,
            }));
          } else {
            this.error = 'Error al cargar las partidas';
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error de conexión al cargar partidas';
          console.error('Error al cargar partidas:', error);
          this.loading = false;
        }
      });
    }
  }

  private normalizarEstado(estado: string): 'en_curso' | 'finalizada' | 'esperando' {
    switch (estado) {
      case 'en_curso':
        return 'en_curso';
      case 'finalizado':
        return 'finalizada';
      case '':
        return 'esperando';
      default:
        return 'esperando';
    }
  }

  unirseAPartida(partidaId: number): void {
    this.router.navigate(['/app/juego', partidaId]);
  }

  verDetalles(partidaId: number): void {
    this.router.navigate(['/app/partidas', partidaId], {
      queryParams: { from: 'mis-partidas' }
    });
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getEstadoClasses(estado: string): string {
    return 'text-gray-300';
  }

  getResultadoClasses(resultado: string | null): string {
    return 'text-gray-300';
  }

  getEstadoText(estado: string): string {
    switch (estado) {
      case 'en_curso':
        return 'En curso';
      case 'finalizado':
        return 'Finalizada';
      case 'esperando':
        return 'Esperando';
      default:
        return estado;
    }
  }

  trackByPartidaId(index: number, partida: Partida): number {
    return partida.id;
  }
}
