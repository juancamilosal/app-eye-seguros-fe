import { Asesor } from './Asesor';

export class Aseguradora {
  id: string;
  nombre: string;
  telefono_bogota: string;
  telefono_nacional: string;
  telefono_celular: string;
  web: string;
  email: string;
  asesores_id?: any[]; // Array de relaciones que contienen los datos del asesor
}
