import { RestaurantesRepo } from "../repositories/restaurantes.repo"

export class RestaurantesService {
  private repo = new RestaurantesRepo();

  
  async listarTodos() {
    return this.repo.listarTodos();
  }

  async atualizarWhatsappRestaurante(restauranteId: string, whatsappNumero: string) {
    return this.repo.atualizarWhatsapp(restauranteId, whatsappNumero);
  }

}