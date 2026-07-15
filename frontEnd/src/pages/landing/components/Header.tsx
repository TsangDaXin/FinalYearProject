import { User } from "lucide-react";

interface HeaderProps {
  onLoginClick: () => void;
}

export function Header({ onLoginClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#161316]/85 backdrop-blur-md border-b border-[#453027]" data-purpose="navigation-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-[#FF6D29]/15">
              <img src="/avatars/biometrics-avatar.png" alt="SteadyGerak" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white font-heading">SteadyGerak</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-[#BABABA]">
            <a href="#pathophysiology" className="hover:text-[#FF6D29] transition-all duration-300">Science of Osteoarthritis</a>
            <a href="#grading-system" className="hover:text-[#FF6D29] transition-all duration-300">KL Grading</a>
            <a href="#sandbox" className="hover:text-[#FF6D29] transition-all duration-300">Video Demo</a>
            <a href="#platform-features" className="hover:text-[#FF6D29] transition-all duration-300">Capabilities</a>
          </nav>

          {/* CTA Group */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onLoginClick}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#FF6D29] hover:bg-[#FF6D29] text-white rounded-xl transition-all shadow-lg shadow-[#FF6D29]/20 flex items-center gap-2 cursor-pointer font-sans"
            >
              <User className="w-3.5 h-3.5 text-white" />
              <span>Login / Sign Up</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
