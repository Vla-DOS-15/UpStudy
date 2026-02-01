import api from '@/lib/axios';

export interface CreatePaymentRequestDto {
    orderId: string;
    amount: number;
    comment?: string;
}

export interface RejectPaymentDto {
    reason: string;
}

export interface PaymentRequest {
    id: string;
    amount: number;
    comment: string;
    status: 'Pending' | 'MarkedAsPaid' | 'Confirmed' | 'Rejected';
    cardNumber: string;
    cardOwnerName: string;
    receiptUrl?: string | null;
    rejectReason?: string | null;
    createdAt: string;
    paidAt?: string | null;
}

export const paymentService = {
    async createRequest(data: CreatePaymentRequestDto): Promise<PaymentRequest> {
        const response = await api.post('/Payments/requests', data);
        return response.data;
    },

    async uploadReceipt(requestId: string, file: File): Promise<PaymentRequest> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/Payments/requests/${requestId}/receipt`, formData);
        return response.data;
    },

    async confirmPayment(requestId: string): Promise<PaymentRequest> {
        const response = await api.post(`/Payments/requests/${requestId}/confirm`);
        return response.data;
    },

    async rejectPayment(requestId: string, data: RejectPaymentDto): Promise<PaymentRequest> {
        const response = await api.post(`/Payments/requests/${requestId}/reject`, data);
        return response.data;
    },

    async getRequestsByOrder(orderId: string): Promise<PaymentRequest[]> {
        const response = await api.get(`/Payments/order/${orderId}`);
        return response.data;
    }
};
