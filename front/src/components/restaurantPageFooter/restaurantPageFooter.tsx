import './restaurantPageFooter.css';

interface RestaurantPageFooterProps {
    actualPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function RestaurantPageFooter({ actualPage, totalPages, onPageChange }: RestaurantPageFooterProps) {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (actualPage <= 3) {
                pages.push(1, 2, 3, 4);
                if (totalPages > 5) pages.push('...');
                pages.push(totalPages);
            } else if (actualPage >= totalPages - 2) {
                pages.push(1);
                if (totalPages > 5) pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(actualPage - 1, actualPage, actualPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    return (
        <div className="restaurant-page-footer">
            {actualPage > 1 && (
                <button 
                    className="pagination-button prev"
                    onClick={() => onPageChange(actualPage - 1)}
                >
                    ←
                </button>
            )}
            
            <div className="page-numbers">
                {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                        <span key={`ellipsis-${index}`} className="ellipsis">...</span>
                    ) : (
                        <button
                            key={page}
                            className={`page-number ${actualPage === page ? 'active' : ''}`}
                            onClick={() => onPageChange(page as number)}
                        >
                            {page}
                        </button>
                    )
                ))}
            </div>
            
        {actualPage < totalPages && (
            <button
                className="pagination-button next"
                onClick={() => onPageChange(actualPage + 1)}
            >
                →
            </button>
        )}
        </div>
    );
}

export default RestaurantPageFooter;