import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estadisticas-grafica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas-grafica.component.html',
})
export class EstadisticasGraficaComponent {
  @Input() ganadas = 0;
  @Input() perdidas = 0;
  @Output() barClick = new EventEmitter<'ganadas' | 'perdidas'>();

  get total() {
    return this.ganadas + this.perdidas || 1;
  }

  get porcentajeGanadas() {
    return (this.ganadas / this.total) * 100;
  }

  get porcentajePerdidas() {
    return (this.perdidas / this.total) * 100;
  }

  datos = () =>
    [
      {
        tipo: 'ganadas',
        valor: this.ganadas,
        porcentaje: this.porcentajeGanadas,
        clase: 'bg-gradient-to-t from-green-600 to-green-400',
        etiqueta: 'Ganadas',
      },
      {
        tipo: 'perdidas',
        valor: this.perdidas,
        porcentaje: this.porcentajePerdidas,
        clase: 'bg-gradient-to-t from-red-600 to-red-400',
        etiqueta: 'Perdidas',
      },
    ] as const;

  getBarHeight(porcentaje: number): number {
    // Asegurar que la altura mínima sea 5% para visibilidad
    return Math.max(porcentaje, 5);
  }

}
