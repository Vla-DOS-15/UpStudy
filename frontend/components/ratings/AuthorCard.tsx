import { Author } from "@/services/userService";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, CheckCircle, User } from "lucide-react";
import Link from "next/link";

interface AuthorCardProps {
    author: Author;
}

export function AuthorCard({ author }: AuthorCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-sm">
                        <AvatarImage src={author.avatarUrl || undefined} alt={author.userName} className="object-cover" />
                        <AvatarFallback className="text-xl bg-orange-100 text-orange-600">
                            {author.userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <h3 className="text-lg font-bold">{author.userName}</h3>
                <div className="flex items-center justify-center gap-1 text-orange-500 font-medium">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{author.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm font-normal">({author.reviewsCount} відгуків)</span>
                </div>
            </CardHeader>
            <CardContent className="text-center text-sm pb-4">
                <div className="line-clamp-3 text-muted-foreground mb-4 min-h-[60px]">
                    {author.aboutMe || "Автор ще не додав опис про себе, але активно виконує замовлення."}
                </div>
                <div className="flex items-center justify-center gap-4 text-sm font-medium">
                    <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        {author.completedOrdersCount} виконано
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-0 flex justify-center pb-6">
                <Link href={`#`} className="w-full">
                    {/* TODO: Add profile link when available: /dashboard/authors/{author.id} */}
                    <Button variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" /> Профіль
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
