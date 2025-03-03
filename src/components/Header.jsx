import { Link } from "react-router-dom";
import LanguageSwitcher from './LanguageSwitcher';

export const Header = () => {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Reelify</h1>
        </Link>
        <nav className="flex gap-4">
          <Link to="/" className="hover:text-blue-300">Home</Link>
          <Link to="/movies" className="hover:text-blue-300">Movies</Link>
          <Link to="/tv" className="hover:text-blue-300">TV Shows</Link>
          <Link to="/search" className="hover:text-blue-300">Search</Link>
        </nav>
        <div className="flex items-center">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};