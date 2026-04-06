export function PeriodSelector({ month, year, onChange, disabled = false }) {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevious = () => {
    let newMonth = parseInt(month) - 1;
    let newYear = parseInt(year);
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onChange({ month: String(newMonth), year: String(newYear) });
  };

  const handleNext = () => {
    let newMonth = parseInt(month) + 1;
    let newYear = parseInt(year);
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onChange({ month: String(newMonth), year: String(newYear) });
  };

  const monthName = monthNames[parseInt(month) - 1] || 'Mês Atual';

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrevious}
        disabled={disabled}
        className="p-2 rounded-lg bg-surface-container-highest/40 border border-outline-variant/10 text-secondary hover:text-white hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-xl">chevron_left</span>
      </button>

      <div className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-highest/40 backdrop-blur border border-outline-variant/10 text-center min-w-[160px]">
        <div className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Período</div>
        <div className="text-sm font-semibold text-white">{monthName} {year}</div>
      </div>

      <button
        onClick={handleNext}
        disabled={disabled}
        className="p-2 rounded-lg bg-surface-container-highest/40 border border-outline-variant/10 text-secondary hover:text-white hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-xl">chevron_right</span>
      </button>
    </div>
  );
}
