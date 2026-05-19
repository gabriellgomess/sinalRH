import { RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

export function RiskRadarChart({ dimensoes }) {
  const data = Object.entries(dimensoes).map(([key, value]) => ({ subject: key, value }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsRadar data={data} cx="50%" cy="50%" outerRadius={80}>
        <PolarGrid stroke="#e2e6ec" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 10, fill: '#666666', fontFamily: 'Inter' }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#e67e22"
          fill="#e67e22"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value) => [`${value}`, 'Score']}
          contentStyle={{ fontSize: 12, fontFamily: 'Inter', borderRadius: 8, border: '1px solid #e2e6ec' }}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}
