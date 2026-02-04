import { RestaurantesRepo } from "../repositories/restaurantes.repo"

export class RestaurantesService {
  private repo = new RestaurantesRepo();

  async atualizarWhatsappRestaurante(restauranteId: string, whatsappNumero: string) {
    return this.repo.atualizarWhatsapp(restauranteId, whatsappNumero);
  }
}