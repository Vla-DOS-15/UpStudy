
import ChatWindow from "@/components/chat/ChatWindow";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ChatPage({ params, searchParams }: PageProps) {
    const { id } = await params;

    return (
        <ChatWindow chatId={id} />
    );
}
