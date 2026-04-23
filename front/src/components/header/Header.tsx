import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaUser, FaSignOutAlt } from "react-icons/fa";
import type { userData } from '../../users';
import { searchUsers } from '../../api/users';
import { getAllRestaurantsPaginated } from '../../api/restaurant';
import SearchResults from '../searchResult/SearchResults';
import type { User } from '../../api/users';
import type { Restaurant } from '../../interface/restaurant';
import './Header.css'

interface HeaderProps {
    user: userData | null;
    setUser: React.Dispatch<React.SetStateAction<userData | null>>;
    onSearch?: (query: string) => void;
    availableGenres?: string[];
    filters?: any;
    onFiltersChange?: (filters: any) => void;
    onClearFilters?: () => void;
    showSearchBar?: boolean;
    currentPage?: string;
}

function Header({
    user,
    setUser,
    onSearch,
    showSearchBar = true
}: HeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
    const [searchedRestaurants, setSearchedRestaurants] = useState<Restaurant[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchTimeout = useRef<NodeJS.Timeout>();
    
    const navigate = useNavigate();
    const location = useLocation();

    console.log("User in Header:", user);

    // Fermer le dropdown si on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) {
                setMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        closeMenu();
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        closeMenu();
        navigate('/');
        console.log('Utilisateur déconnecté');
    };

    const performSearch = async (query: string) => {
        if (!query.trim() || !user) {
            setSearchedUsers([]);
            setSearchedRestaurants([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        setShowResults(true);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            // Rechercher en parallèle les utilisateurs et les restaurants
            const [usersResult, restaurantsData] = await Promise.all([
                searchUsers(query, token).catch(() => []),
                getAllRestaurantsPaginated(token).catch(() => [])
            ]);

            // Filtrer les restaurants localement
            const filteredRestaurants = restaurantsData
                .filter((r: any) => 
                    r.name.toLowerCase().includes(query.toLowerCase()) ||
                    r.address?.toLowerCase().includes(query.toLowerCase()) ||
                    r.genres?.some((g: string) => g.toLowerCase().includes(query.toLowerCase()))
                )
                .slice(0, 5)
                .map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    address: r.address,
                    phone: r.tel,
                    location: {
                        lat: r.location?.coordinates?.[1] || 0,
                        lng: r.location?.coordinates?.[0] || 0
                    },
                    directions: `https://maps.google.com/?q=${r.location?.coordinates?.[1]},${r.location?.coordinates?.[0]}`,
                    hours: 'Hours available',
                    photos: r.pictures || [],
                    genres: r.genres || [],
                    priceRange: '$'.repeat(r.price_range || 1),
                    rating: r.rating || 0,
                    priceRangeNumber: r.price_range || 1
                }));

            setSearchedUsers(usersResult.slice(0, 5));
            setSearchedRestaurants(filteredRestaurants);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            setSearchedUsers([]);
            setSearchedRestaurants([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        
        // Appeler onSearch pour la page Home (filtre local)
        if (onSearch) {
            onSearch(value);
        }

        // Debounce pour la recherche API
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    const handleCloseResults = () => {
        setShowResults(false);
    };

    const shouldShowSearch = showSearchBar && (
        location.pathname === '/' ||
        location.pathname.includes('/restaurant') ||
        location.pathname.includes('/user')
    );

    return (
        <header className="header">
            <nav className="header-nav">
                <div className="logo-section">
                    <span className="logo-text" onClick={() => handleNavigation('/')}>UFood</span>
                </div>

                {shouldShowSearch && user && (
                    <div className="nav-desktop search-container" ref={searchRef}>
                        <form className="search-bar" onSubmit={(e) => e.preventDefault()}>
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search users or restaurants..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e: any) => handleSearchChange(e.target.value)}
                                onFocus={() => {
                                    if (searchQuery.trim()) {
                                        setShowResults(true);
                                    }
                                }}
                            />
                        </form>
                        {showResults && (
                            <SearchResults
                                users={searchedUsers}
                                restaurants={searchedRestaurants}
                                isLoading={isSearching}
                                onClose={handleCloseResults}
                            />
                        )}
                    </div>
                )}


                <div className="nav-desktop login-button">
                    {user ? (
                        <div className="user-dropdown">
                            <button
                                className="nav-button"
                                onClick={() => handleNavigation('/profil')}
                            >
                                <FaUser className="dropdown-icon" />
                                {user.name}
                            </button>
                            <div className="dropdown-divider"></div>
                            <button
                                className="nav-button logout"
                                onClick={handleLogout}
                            >
                                <FaSignOutAlt className="dropdown-icon" />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button className="nav-button" onClick={() => handleNavigation('/login')}>
                            Login
                        </button>
                    )}
                </div>

                <button className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`} onClick={toggleMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </nav>

            <div className={`nav-mobile ${menuOpen ? 'nav-mobile-open' : ''}`}>
                <div className="nav-mobile-content">
                    {shouldShowSearch && user && (
                        <form className="mobile-search-bar" onSubmit={(e) => e.preventDefault()}>
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search users or restaurants..."
                                className="mobile-search-input"
                                value={searchQuery}
                                onChange={(e: any) => handleSearchChange(e.target.value)}
                            />
                        </form>
                    )}
                    <button className="nav-button-mobile" onClick={() => handleNavigation('/')}>
                        Restaurants
                    </button>
                    {user ? (
                        <>
                            <div className="mobile-user-info">
                                <span>Connected as {user.name}</span>
                            </div>
                            <button className="nav-button-mobile" onClick={() => handleNavigation('/profil')}>
                                Profile
                            </button>
                            <button className="nav-button-mobile logout" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <button className="nav-button-mobile" onClick={() => handleNavigation('/login')}>
                            Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header