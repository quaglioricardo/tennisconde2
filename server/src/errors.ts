export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export const badRequest = (m: string) => new HttpError(400, m);
export const unauthorized = (m = 'Não autenticado') => new HttpError(401, m);
export const forbidden = (m = 'Sem permissão') => new HttpError(403, m);
export const notFound = (m = 'Não encontrado') => new HttpError(404, m);
export const conflict = (m: string) => new HttpError(409, m);
