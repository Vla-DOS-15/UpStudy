
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OrderDetailsCardProps {
    userRole: string;
    order: any;
}

export default function OrderDetailsCard({ userRole, order }: OrderDetailsCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">{order.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">ID: {order.id}</p>
                    </div>
                    <Badge variant={order.status === "New" ? "default" : "secondary"}>
                        {order.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Опис</h3>
                    <p className="whitespace-pre-wrap text-sm">{order.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-semibold">Бюджет:</span> {order.price} UAH
                    </div>
                    <div>
                        <span className="font-semibold">Дедлайн:</span> {new Date(order.deadline).toLocaleDateString()}
                    </div>
                    <div>
                        <span className="font-semibold">Тип:</span> {order.workType?.name}
                    </div>
                    <div>
                        <span className="font-semibold">Предмет:</span> {order.discipline?.name}
                    </div>
                </div>

                {/* Placeholder for more details */}
            </CardContent>
        </Card>
    );
}
