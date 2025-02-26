// ... existing imports ...
import LanguageSwitcher from './LanguageSwitcher';

function Header() {
  return (
    <header className="bg-black text-white p-4 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Flixsy</h1>
      </div>
      
      {/* Add Language Switcher here */}
      <div className="flex items-center">
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export default Header;