import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-rp-cinza-borda rounded-lg px-3 py-2 shadow-card">
      <p className="text-xs font-semibold text-rp-texto mb-1 capitalize">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-rp-cinza-medio capitalize">{p.name}:</span>
          <span className="font-semibold text-rp-texto">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function EvolutionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" vertical={false} />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 11, fill: '#666666', fontFamily: 'Inter' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[60, 100]}
          tick={{ fontSize: 11, fill: '#666666', fontFamily: 'Inter' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: 'Inter', paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#666666', textTransform: 'capitalize' }}>{value}</span>}
        />
        <Line
          type="monotone"
          dataKey="clima"
          name="Clima"
          stroke="#003366"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#003366', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#003366' }}
        />
        <Line
          type="monotone"
          dataKey="engajamento"
          name="Engajamento"
          stroke="#e67e22"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={{ r: 3, fill: '#e67e22', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#e67e22' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
