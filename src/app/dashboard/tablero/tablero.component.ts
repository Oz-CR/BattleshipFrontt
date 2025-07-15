import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Disparo {
  posicion: string;
  impacto: boolean;
  hundido: boolean;
}

export interface Estadisticas {
  totalDisparos: number;
  impactos: number;
  precision: number;
}

export interface CeldaHoverEvent {
  posicion: string;
}

export interface DispararEvent {
  posicion: string;
}

@Component({
  selector: 'app-tablero',
  imports: [CommonModule],
  templateUrl: './tablero.component.html',
  styleUrls: ['./tablero.component.css']
})
export class TableroComponent implements OnInit {
  @Input() esPropio: boolean = false;
  @Input() nombreJugador: string = '';
  @Input() posicionesBarcos: string[] = [];
  @Input() disparos: Disparo[] = [];
  @Input() puedeDisparar: boolean = false;
  @Input() mostrarBarcos: boolean = false;
  @Input() mostrarInfo: boolean = true;
  @Input() estadisticas: Estadisticas = {
    totalDisparos: 0,
    impactos: 0,
    precision: 0
  };
  @Input() juegoTerminado: boolean = false;
  @Input() ganador: string | null = null;

  @Output() disparar = new EventEmitter<DispararEvent>();
  @Output() celdaHover = new EventEmitter<CeldaHoverEvent>();

  letras: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  numeros: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
  mapaDisparos: { [key: string]: Disparo } = {};

  ngOnInit(): void {
    this.actualizarMapaDisparos();
  }

  ngOnChanges(): void {
    this.actualizarMapaDisparos();
  }

  private actualizarMapaDisparos(): void {
    this.mapaDisparos = {};
    this.disparos.forEach(disparo => {
      this.mapaDisparos[disparo.posicion] = disparo;
    });
  }

  tieneBarco(posicion: string): boolean {
    return this.posicionesBarcos.includes(posicion);
  }

  fueDisparado(posicion: string): boolean {
    return posicion in this.mapaDisparos;
  }

  obtenerDisparo(posicion: string): Disparo | null {
    return this.mapaDisparos[posicion] || null;
  }

  obtenerClaseCelda(posicion: string): string {
    const disparo = this.obtenerDisparo(posicion);
    const hayBarco = this.tieneBarco(posicion);
    const disparado = this.fueDisparado(posicion);

    let clases: string[] = [];

    if (!disparado && !hayBarco) {
      clases.push('bg-gray-100 hover:bg-gray-200');
    }

    if (hayBarco && (this.mostrarBarcos || (disparo && disparo.hundido))) {
      if (!disparado) {
        clases.push('bg-blue-500 border-blue-600');
      }
    }

    if (disparado && disparo) {
      if (disparo.impacto) {
        if (disparo.hundido) {
          clases.push('bg-red-800 border-red-900 text-white');
        } else {
          clases.push('bg-red-500 border-red-600 text-white');
        }
      } else {
        clases.push('bg-blue-400 border-blue-500');
      }
    }

    if (this.puedeDisparar && !disparado && !this.juegoTerminado) {
      clases.push('hover:bg-yellow-200 hover:border-yellow-400');
      clases.push('cursor-pointer');
    } else {
      clases.push('cursor-default');
    }

    return clases.join(' ');
  }

  obtenerContenidoCelda(posicion: string): string {
    // Solo cambiamos colores, no mostramos emojis
    return '';
  }

  manejarClick(posicion: string): void {
    if (!this.puedeDisparar || this.juegoTerminado) return;
    if (this.fueDisparado(posicion)) return;

    this.disparar.emit({ posicion });
  }

  onCeldaHover(posicion: string): void {
    this.celdaHover.emit({ posicion });
  }

  get tituloTablero(): string {
    return this.esPropio ? 'Tu Tablero' : `Tablero de ${this.nombreJugador}`;
  }
}