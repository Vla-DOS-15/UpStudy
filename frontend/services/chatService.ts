
import * as signalR from "@microsoft/signalr";
import axios from "axios";
import Cookies from "js-cookie";

// Types (You might want to move these to a types file)
export interface ChatAttachmentDto {
    id: string;
    originalFileName: string;
    viewUrl: string;
    downloadUrl: string;
}

export interface ChatMessageDto {
    id: string;
    chatId: string;
    text: string;
    sentAt: string;
    isSystem: boolean;
    senderId: string;
    senderName: string;
    attachments: ChatAttachmentDto[];
}

class ChatService {
    private connection: signalR.HubConnection | null = null;
    private apiUrl = process.env.NEXT_PUBLIC_API_URL;
    private hubUrl = process.env.NEXT_PUBLIC_HUB_URL || 'https://localhost:7255/chatHub';

    // --- SIGNALR METHODS ---

    public async startConnection(token: string): Promise<void> {
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) return;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(this.hubUrl, {
                accessTokenFactory: () => token,
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();

        try {
            await this.connection.start();
            console.log("SignalR Connected");
        } catch (err) {
            console.error("SignalR Connection Error: ", err);
        }
    }

    public async stopConnection(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
    }

    public async joinChat(chatId: string) {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            await this.connection.invoke("JoinChat", chatId);
        }
    }

    public async leaveChat(chatId: string) {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            await this.connection.invoke("LeaveChat", chatId);
        }
    }

    // Keep legacy for now if needed, or remove? Removing to force clean usage.
    public async joinGroup(orderId: string, candidateId?: string) {
        // Legacy wrapper if needed, but we should move to joinChat
        // We can leave empty or redirect if we have chatId, but we don't.
    }
    public async leaveGroup(orderId: string, candidateId?: string) { }

    public onMessageReceived(callback: (message: ChatMessageDto) => void) {
        this.connection?.on("ReceiveMessage", callback);
    }

    public offMessageReceived(callback: (message: ChatMessageDto) => void) {
        this.connection?.off("ReceiveMessage", callback);
    }

    public onUnreadCountUpdated(callback: () => void) {
        this.connection?.on("UnreadCountUpdated", callback);
    }

    public offUnreadCountUpdated(callback: () => void) {
        this.connection?.off("UnreadCountUpdated", callback);
    }

    // --- API METHODS ---

    public async initChat(orderId: string, candidateId?: string): Promise<{ chatId: string }> {
        const response = await axios.post(`${this.apiUrl}/chat/init`, { orderId, candidateId }, this.getHeaders());
        return response.data;
    }

    public async getChatMessages(chatId: string): Promise<ChatMessageDto[]> {
        const response = await axios.get(`${this.apiUrl}/chat/room/${chatId}`, this.getHeaders());
        return response.data;
    }

    public async getMessages(orderId: string, candidateId?: string): Promise<ChatMessageDto[]> {
        // Fallback to old behavior or throw
        const params = candidateId ? { candidateId } : {};
        const response = await axios.get(`${this.apiUrl}/chat/${orderId}`, { ...this.getHeaders(), params });
        return response.data;
    }

    public async getTotalUnreadCount(): Promise<number> {
        const response = await axios.get(`${this.apiUrl}/chat/unread-count`, this.getHeaders());
        return response.data.count;
    }

    public async markAsRead(chatId: string): Promise<void> {
        await axios.post(`${this.apiUrl}/chat/room/${chatId}/read`, {}, this.getHeaders());
    }

    public async sendMessage(chatId: string, text: string): Promise<ChatMessageDto> {
        const payload = { text };
        const response = await axios.post(`${this.apiUrl}/chat/room/${chatId}/messages`, payload, this.getHeaders());
        return response.data;
    }

    public async sendFile(chatId: string, file: File): Promise<ChatMessageDto> {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(`${this.apiUrl}/chat/room/${chatId}/files`, formData, {
            ...this.getHeaders(),
            headers: {
                ...this.getHeaders().headers,
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    }

    public async getUserStatus(userId: string): Promise<string> {
        const response = await axios.get(`${this.apiUrl}/chat/user-status/${userId}`, this.getHeaders());
        return response.data;
    }

    private getHeaders() {
        const token = Cookies.get("accessToken");
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }
}

export const chatService = new ChatService();
