export class Client {
  id?: string;
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  direccion: string;
  email: string;
  numero_contacto: string;
  // Información Laboral
  numero_oficina?: string;
  direccion_oficina?: string;
  email_laboral?: string;
}
