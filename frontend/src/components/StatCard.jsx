import React from 'react'

export default function StatCard({ label, value, icon, color = 'blue', trend, subtext }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50/80',
      border: 'border-blue-100',
      text: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
      glow: 'group-hover:shadow-blue-500/10'
    },
    purple: {
      bg: 'bg-purple-50/80',
      border: 'border-purple-100',
      text: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700',
      glow: 'group-hover:shadow-purple-500/10'
    },
    green: {
      bg: 'bg-emerald-50/80',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      glow: 'group-hover:shadow-emerald-500/10'
    },
    orange: {
      bg: 'bg-amber-50/80',
      border: 'border-amber-100',
      text: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
      glow: 'group-hover:shadow-amber-500/10'
    },
    rose: {
      bg: 'bg-rose-50/80',
      border: 'border-rose-100',
      text: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-700',
      glow: 'group-hover:shadow-rose-500/10'
    }
  }

  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ${c.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center text-lg ${c.text}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-slate-900 font-display tracking-tight">{value}</h3>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
            {trend}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  )
}
