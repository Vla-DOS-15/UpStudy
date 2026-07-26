import api from '@/lib/axios';
import { BalanceOverviewDto } from '@/types';

class PaymentService {
  private readonly baseUrl = '/payments';

  public async getBalanceOverview(): Promise<BalanceOverviewDto> {
    const response = await api.get<BalanceOverviewDto>(`${this.baseUrl}/balance`);
    return response.data;
  }
}

export const paymentService = new PaymentService();
