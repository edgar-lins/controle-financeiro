import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatCurrencyBR } from '../utils/format';
import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Summary, Expense } from '../types';

const COLORS = [
  '#5AF0B3',
  '#5AF0B3cc',
  '#5AF0B333',
];

const categoryToGroup: Record<string, string> = {
  'Necessidades': 'essencial',
  'Desejos': 'lazer',
  'Investimento': 'investimento',
};

interface BudgetDonutChartProps {
  summary: Summary;
  expenses?: Expense[];
}

export function BudgetDonutChart({ summary, expenses = [] }: BudgetDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  if (!summary) return null;

  const data = [
    { name: 'Necessidades', value: summary.real_fixos, ideal: summary.ideal_fixos },
    { name: 'Desejos',      value: summary.real_lazer, ideal: summary.ideal_lazer },
    { name: 'Investimento', value: summary.real_invest, ideal: summary.ideal_invest },
  ];

  const totalSpent = data.reduce((sum, item) => sum + item.value, 0);

  const handleCellEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleChartLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const renderTooltip = () => {
    if (hoveredIndex === null) return null;

    const slice = data[hoveredIndex];
    const group = categoryToGroup[slice.name];
    const groupExpenses = expenses.filter(exp => exp.group === group);
    const total = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const tooltipWidth = 260;
    const offsetX = 16;
    const offsetY = 12;
    const x = mousePos.x + offsetX + tooltipWidth > window.innerWidth
      ? mousePos.x - tooltipWidth - offsetX
      : mousePos.x + offsetX;
    const y = mousePos.y - offsetY - 140;

    const tooltip = (
      <div
        className="backdrop-blur-md rounded-xl shadow-2xl p-4 pointer-events-none"
        style={{
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`,
          width: `${tooltipWidth}px`,
          zIndex: 9999,
          backgroundColor: 'rgba(30, 35, 50, 0.97)',
          border: '1px solid rgba(90, 240, 179, 0.35)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[hoveredIndex] }} />
            <p className="text-white font-headline font-bold text-sm">{slice.name}</p>
          </div>
          <p className="text-primary text-sm font-semibold">{formatCurrencyBR(total)}</p>
        </div>

        <div className="h-px mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {groupExpenses.length > 0 ? (
            groupExpenses.map((exp, idx) => (
              <div key={idx} className="flex justify-between items-center gap-2">
                <span className="text-secondary text-xs truncate">{exp.description}</span>
                <span className="text-white text-xs font-semibold flex-shrink-0">{formatCurrencyBR(exp.amount)}</span>
              </div>
            ))
          ) : (
            <p className="text-secondary/50 text-xs italic">Sem gastos registrados</p>
          )}
        </div>
      </div>
    );

    return createPortal(tooltip, document.body);
  };

  return (
    <div className="bg-surface-container-low/50 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline font-bold text-xl text-white">Distribuição 50/30/20</h3>
      </div>

      <div
        className="flex justify-center items-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleChartLeave}
      >
        <div className="relative w-72 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    opacity={hoveredIndex === index ? 1 : hoveredIndex !== null ? 0.5 : 1}
                    style={{ transition: 'opacity 150ms ease', cursor: 'pointer' }}
                    onMouseEnter={() => handleCellEnter(index)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center">
              {hoveredIndex !== null ? (
                <>
                  <p className="text-secondary text-xs font-medium uppercase tracking-widest mb-1">
                    {data[hoveredIndex].name}
                  </p>
                  <p className="font-headline text-2xl font-bold text-white">
                    {formatCurrencyBR(data[hoveredIndex].value)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-secondary text-xs font-medium uppercase tracking-widest mb-1">Total Gasto</p>
                  <p className="font-headline text-2xl font-bold text-white">{formatCurrencyBR(totalSpent)}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {renderTooltip()}

      <div className="flex justify-center gap-8 mt-8">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
            <div className="text-xs">
              <p className="text-on-surface font-semibold">{item.name}</p>
              <p className="text-secondary mt-0.5">{formatCurrencyBR(item.value)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
