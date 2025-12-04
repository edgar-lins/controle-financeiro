import { useState } from "react";
import { HiInformationCircle } from "react-icons/hi";

export function PageHeader({ title, subtitle, description, colorClass = "from-blue-600 to-cyan-600", greeting }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className={`bg-gradient-to-r ${colorClass} rounded-lg p-8 text-white shadow-lg`}>
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">{title}</h1>
            {description && (
              <div className="relative">
                <button
                  type="button"
                  className="text-white/80 hover:text-white transition-colors focus:outline-none"
                  onMouseEnter={() => setShowInfo(true)}
                  onMouseLeave={() => setShowInfo(false)}
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <HiInformationCircle className="text-lg" />
                </button>

                {showInfo && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-slate-900 text-white text-sm rounded-lg shadow-xl border border-cyan-400/30 p-4 z-50">
                    {description}
                  </div>
                )}
              </div>
            )}
          </div>
          {subtitle && <p className="text-blue-100 text-lg">{subtitle}</p>}
        </div>
        {greeting && (
          <div className="flex-shrink-0">
            <div className="bg-black/15 backdrop-blur-md rounded-2xl px-5 py-3 shadow-inner border border-white/10">
              {greeting}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
