import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#161316] border-t border-[#453027] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Logo and Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#FF6D29] rounded-md flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-bold text-white font-heading">
                SteadyGerak
              </span>
            </div>
            <p className="text-xs text-[#BABABA]">
              © 2026 SteadyGerak Healthcare Solutions. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
