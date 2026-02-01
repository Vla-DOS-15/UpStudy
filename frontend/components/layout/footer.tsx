
import Link from 'next/link';
import { Phone, Mail, Send } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-background border-t py-12 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    {/* Brand Column */}
                    <div className="md:col-span-1 space-y-4">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                            <span className="text-primary">Up</span>Study
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Платформа для допомоги студентам. Знайдіть виконавця або станьте ним.
                        </p>
                    </div>

                    {/* Contact Column */}
                    <div className="md:col-span-2 md:col-start-3 space-y-4">
                        <h3 className="font-semibold text-lg">Контакти підтримки</h3>
                        <div className="space-y-3">
                            <a
                                href="tel:+380999999999"
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                            >
                                <Phone className="h-4 w-4" />
                                <span>+380 99 999 99 99</span>
                            </a>

                            <a
                                href="mailto:support@upstudy.com"
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200"
                            >
                                <Mail className="h-4 w-4" />
                                <span>support@upstudy.com</span>
                            </a>

                            <a
                                href="https://t.me/upstudy_support"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-muted-foreground hover:text-[#0088cc] transition-colors duration-200"
                            >
                                <Send className="h-4 w-4" />
                                <span>Telegram Support</span>
                            </a>
                        </div>
                    </div>

                    {/* Legal/Copyright */}
                    <div className="md:col-span-4 border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} UpStudy. Всі права захищено.</p>
                    </div>

                </div>
            </div>
        </footer>
    );
}
