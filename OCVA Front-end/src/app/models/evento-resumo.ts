// Evento ligado a um ensaio. "marcado" = true quando o evento ainda não aconteceu.
export interface EventoResumo {
  id: number;
  titulo: string;
  data: string;
  marcado: boolean;
}
