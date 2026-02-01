
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationControlsProps) {
    // If there's only 1 page (or 0), don't show controls
    if (totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        // Show max 5 page buttons logic can be complex, let's keep it simple for now:
        // If <= 7 pages, show all.
        // If > 7 pages, show 1, 2, ..., current-1, current, current+1, ..., last-1, last

        // Simple version: just show all if small, or sliced window
        // Let's implement a simple sliding window of 5 pages around current

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className="flex items-center justify-center space-x-2 py-4">
            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                title="Попередня сторінка"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {pages[0] > 1 && (
                <>
                    <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="icon"
                        onClick={() => onPageChange(1)}
                    >
                        1
                    </Button>
                    {pages[0] > 2 && <span className="text-muted-foreground">...</span>}
                </>
            )}

            {pages.map((page) => (
                <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </Button>
            ))}

            {pages[pages.length - 1] < totalPages && (
                <>
                    {pages[pages.length - 1] < totalPages - 1 && <span className="text-muted-foreground">...</span>}
                    <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="icon"
                        onClick={() => onPageChange(totalPages)}
                    >
                        {totalPages}
                    </Button>
                </>
            )}

            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                title="Наступна сторінка"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
