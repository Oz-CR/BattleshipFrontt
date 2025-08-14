import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil, startWith } from 'rxjs/operators';
import { throwError, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Partida {
  id: number;
  nombre: string;
  descripcion: string;
}

interface UsuarioPartida {
  id: number;
  fullName: string;
  email: string;
}

export interface unirsePartidaResponse {
  success: boolean;
  data: PartidaAPi;
}

export interface PartidaAPi {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  ganadorId: number | null;
  createdAt: string;
  updatedAt: string;
  usuarios: UsuarioPartida[];
}

export interface IndexPartidasResponse {
  success: boolean;
  data: PartidaAPi[];
}

export interface EstadoPartida {
  [x: string]: any;
  totalJugadores: number;
  puedeIniciar: boolean;
  estado: string;
}

export interface PartidaResponse {
  partida: Partida;
  totalJugadores: number;
}

interface MisPartidasResponse {
  success: boolean;
  data: any[];
  message?: string;
  error?: string;
}

export interface CreatePartidaData {
  nombre: string;
  descripcion: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreatePartidaApiData {
  partida: Partida;
  JugadoresPartida: any;
}

@Injectable({
  providedIn: 'root',
})
export class PartidaService {
  private apiUrl = environment.apiUrl; 
  private partidasUrl = `${this.apiUrl}/partidas`;
  private stopPolling = new Subject<void>();

  constructor(private http: HttpClient) {}

  verificarEstado(partidaId: number, pollingInterval: number = 2000): Observable<EstadoPartida> {
    if (!partidaId || isNaN(partidaId)) {
      return throwError(() => new Error('ID de partida inválido'));
    }

    // Función para hacer la verificación del estado
    const checkStatus = () => this.http
      .get<EstadoPartida>(`${this.partidasUrl}/${partidaId}/verificar-estado`)
      .pipe(
        map(response => {
          console.log('Estado actual de la partida:', response);
          return response;
        }),
        catchError((error) => {
          console.error('Error al verificar estado:', error);
          return throwError(() => error);
        })
      );

    // Hacer una verificación inicial y luego comenzar el polling
    return checkStatus().pipe(
      switchMap(initialState => {
        // Si ya puede iniciar, retornar el estado actual
        if (initialState.puedeIniciar) {
          return of(initialState);
        }
        // Si no puede iniciar, comenzar el polling
        return interval(pollingInterval).pipe(
          startWith(-1), // Emite inmediatamente después de la verificación inicial
          switchMap(() => checkStatus()),
          takeUntil(this.stopPolling)
        );
      }));
  }

  cancelarPartida(partidaId: number): Observable<any> {
    if (!partidaId || isNaN(partidaId)) {
      return throwError(() => new Error('ID de partida inválido'));
    }

    return this.http.delete<any>(`${this.partidasUrl}/${partidaId}`).pipe(
      catchError((error) => {
        console.error('Error al cancelar partida:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerPartida(partidaId: number): Observable<PartidaResponse> {
    if (!partidaId || isNaN(partidaId)) {
      return throwError(() => new Error('ID de partida inválido'));
    }

    return this.http
      .get<PartidaResponse>(`${this.partidasUrl}/${partidaId}`)
      .pipe(
        catchError((error) => {
          console.error('Error al obtener partida:', error);
          return throwError(() => error);
        })
      );
  }

  getPartidas(pollingInterval: number = 3000): Observable<PartidaAPi[]> {
    return interval(pollingInterval).pipe(
      switchMap(() => this.http.get<IndexPartidasResponse>(this.partidasUrl)),
      map((response) => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error('Respuesta de API inválida');
        }
      }),
      takeUntil(this.stopPolling),
      catchError((error) => {
        console.error('Error al obtener partidas:', error);
        return throwError(() => error);
      })
    );
  }

  createPartida(data: CreatePartidaData): Observable<Partida> {
    if (!data || !data.nombre || !data.descripcion) {
      return throwError(() => new Error('Datos de partida inválidos'));
    }

    return this.http
      .post<ApiResponse<CreatePartidaApiData>>(this.partidasUrl, data)
      .pipe(
        map((response) => {
          if (response.success && response.data && response.data.partida) {
            return response.data.partida;
          } else {
            throw new Error('Respuesta de API inválida');
          }
        }),
        catchError((error) => {
          console.error('Error al crear partida:', error);
          return throwError(() => error);
        })
      );
  }

  updatePartida(partida: Partida): Observable<Partida> {
    if (!partida || !partida.id || isNaN(partida.id)) {
      return throwError(() => new Error('Partida inválida'));
    }

    return this.http
      .put<Partida>(`${this.partidasUrl}/${partida.id}`, partida)
      .pipe(
        catchError((error) => {
          console.error('Error al actualizar partida:', error);
          return throwError(() => error);
        })
      );
  }

  getMisPartidas(): Observable<MisPartidasResponse> {
    return this.http
      .get<MisPartidasResponse>(`${this.apiUrl}/mis-partidas`)
      .pipe(
        catchError((error) => {
          console.error('Error al obtener mis partidas:', error);
          return throwError(() => error);
        })
      );
  }

  unirsePartida(partida: PartidaAPi): Observable<unirsePartidaResponse> {
    return this.http.post<unirsePartidaResponse>(
      `${this.partidasUrl}/${partida.id}/unirse`,
      partida
    );
  }

  deletePartida(id: number): Observable<any> {
    if (!id || isNaN(id)) {
      return throwError(() => new Error('ID de partida inválido'));
    }

    return this.http.delete<any>(`${this.partidasUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Error al eliminar partida:', error);
        return throwError(() => error);
      })
    );
  }


 getEstadisticas(): Observable<{ success: boolean; ganadas: number; perdidas: number }> {
    return this.http.get<{ success: boolean; ganadas: number; perdidas: number }>(
      `${this.apiUrl}/estadisticas`
    );
  }

  getPartidasFiltradas(tipo: 'ganadas' | 'perdidas'): Observable<{
    success: boolean;
    partidas: any[];
    tipo: string;
  }> {
    return this.http.get<{ success: boolean; partidas: any[]; tipo: string }>(
      `${this.apiUrl}/estadisticas/partidas/${tipo}`
    );
  }
   obtenerDetalle(id: string | number, from: string) {
    return this.http.get<any>(`${this.apiUrl}/detalle-partida/${id}`, {
      params: { from },
    }).toPromise().then(response => {
      if (!response.success) throw new Error('Partida no encontrada');

      const partida = this.adaptarPartida(response.data.partida);
      const movimientos = this.adaptarMovimientos(response.data.movimientos || []); 

      partida.jugadores.forEach((j: any) => {
      j.movimientos_atacante = movimientos.filter(m => m.atacante.id === j.id);
      j.movimientos_defensor = movimientos.filter(m => m.defensor.id === j.id);
    });
      return { partida, movimientos };
    });
  }

  private adaptarPartida(data: any): any {
    return {
      id: data.id,
      estado: data.estado,
      ganador_id: data.ganadorId,
      jugadores: data.jugadores.map((j: any) => ({
        id: j.id,
        usuario: {
          id: j.usuario.id,
          name: j.usuario.fullName,
          email: j.usuario.email
        },
        barcos: (j.barcos || []).map((b: any) => ({
          id: b.id,
          coordenada: b.coordenada,
          tipo: 'barco', 
          hundido: b.hundido
        })),
        movimientos_atacante: [],
        movimientos_defensor: [],
      }))
    };
  }

  private adaptarMovimientos(data: any[]): any[] {
    return data.map(m => ({
      id: m.id,
      coordenada: m.coordenada,
      acierto: m.acierto,
      hundido: m.hundido ?? false,
      idAtacante: m.idAtacante,
      idDefensor: m.idDefensor,
      atacante: {
        id: m.atacante.id,
        usuario: {
          id: m.atacante.usuario.id,
          name: m.atacante.usuario.fullName,
          email: m.atacante.usuario.email,
        },
      },
      defensor: {
        id: m.defensor.id,
        usuario: {
          id: m.defensor.usuario.id,
          name: m.defensor.usuario.fullName,
          email: m.defensor.usuario.email,
        },
      }
    }));
  }

  stopAllPolling() {
    this.stopPolling.next();
  }
}
