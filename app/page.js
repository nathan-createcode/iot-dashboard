'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function Home() {
  const [countryData, setCountryData] = useState([])
  const [criticalData, setCriticalData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchData() {
      const { data: country } = await supabase
        .from('iot_by_country')
        .select('*')
        .order('total_devices', { ascending: false })

      const { data: critical } = await supabase
        .from('iot_critical')
        .select('*')
        .order('critical_devices', { ascending: false })
        .limit(10)

      const { data: allCritical } = await supabase
        .from('iot_critical')
        .select('cca2, critical_devices')

      // Gabungkan data critical ke country
      const criticalMap = {}
      if (allCritical) {
        allCritical.forEach(d => {
          if (!criticalMap[d.cca2]) criticalMap[d.cca2] = 0
          criticalMap[d.cca2] += d.critical_devices
        })
      }

      const countryWithCritical = (country || []).map(d => ({
        ...d,
        critical_devices: criticalMap[d.cca2] || 0
      }))

      setCountryData(countryWithCritical)
      setCriticalData(critical || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const filtered = countryData.filter(d =>
    (d.cn || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.cca2 || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalDevices = countryData.reduce((sum, d) => sum + (d.total_devices || 0), 0)
  const avgTemp = countryData.length
    ? (countryData.reduce((sum, d) => sum + (d.avg_temp || 0), 0) / countryData.length).toFixed(1)
    : 0
  const avgHumidity = countryData.length
    ? (countryData.reduce((sum, d) => sum + (d.avg_humidity || 0), 0) / countryData.length).toFixed(1)
    : 0
  const totalCritical = countryData.reduce((sum, d) => sum + (d.critical_devices || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-xl">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cyan-400">IoT Global Dashboard</h1>
        <p className="text-gray-400 mt-1">Real-time monitoring perangkat IoT di seluruh dunia</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Perangkat</p>
          <p className="text-2xl font-bold text-cyan-400">{totalDevices.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Rata-rata Suhu</p>
          <p className="text-2xl font-bold text-orange-400">{avgTemp}°C</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Rata-rata Kelembapan</p>
          <p className="text-2xl font-bold text-blue-400">{avgHumidity}%</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Baterai Kritis</p>
          <p className="text-2xl font-bold text-red-400">{totalCritical.toLocaleString()}</p>
        </div>
      </div>

      {/* Chart: Top 10 Critical Devices */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-white">Top 10 Negara — Perangkat Baterai Kritis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={criticalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="cca2" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            <Bar dataKey="critical_devices" fill="#F87171" name="Perangkat Baterai Kritis" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart: Avg Temp Top 10 */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-white">Top 10 Negara — Rata-rata Suhu & Kelembapan</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={countryData.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="cca2" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            <Bar dataKey="avg_temp" fill="#FB923C" name="Suhu (°C)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avg_humidity" fill="#60A5FA" name="Kelembapan (%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Search & Table */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Data per Negara</h2>
          <input
            type="text"
            placeholder="Cari negara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-cyan-500 w-48"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 pr-4">Negara</th>
                <th className="text-left py-2 pr-4">Kode</th>
                <th className="text-right py-2 pr-4">Suhu (°C)</th>
                <th className="text-right py-2 pr-4">Kelembapan (%)</th>
                <th className="text-right py-2 pr-4">CO₂</th>
                <th className="text-right py-2 pr-4">Batrei Perangkat Kritis</th>
                <th className="text-right py-2">Total Perangkat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="py-2 pr-4">{row.cn || '—'}</td>
                  <td className="py-2 pr-4 text-gray-400">{row.cca2}</td>
                  <td className="py-2 pr-4 text-right text-orange-400">{row.avg_temp}</td>
                  <td className="py-2 pr-4 text-right text-blue-400">{row.avg_humidity}</td>
                  <td className="py-2 pr-4 text-right text-green-400">{row.avg_co2}</td>
                  <td className="py-2 pr-4 text-right text-red-400">{row.critical_devices?.toLocaleString() || '—'}</td>
                  <td className="py-2 text-right text-cyan-400">{row.total_devices?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}