import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart, Cell } from 'recharts';
import { TrendingUp, Users, Target, Award } from 'lucide-react';
import type { Student } from './types/seleksi'; // Import Student type from App.tsx

// Define a more structured type for processed student data
interface ProcessedStudent {
  urut: number;
  noDaftar: string;
  nama: string;
  nilaiAkhir: number;
}

interface ScoreAnalysisProps {
  students: Student[]; // Expecting the raw Student array from App.tsx
  schoolName?: string; // Optional school name for display
}

const ScoreAnalysis: React.FC<ScoreAnalysisProps> = React.memo(({ students: rawStudents, schoolName }) => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const processData = () => {
      if (!rawStudents || rawStudents.length === 0) {
        setData([]);
        setStats({});
        return;
      }

      // Transform raw Student array into ProcessedStudent objects
      const processedStudents: ProcessedStudent[] = [];
      for (const row of rawStudents) {
        const score = parseFloat(row[4]); // row[4] is nilaiAkhir
        if (!isNaN(score)) {
          processedStudents.push({
            urut: row[0], // row[0] is urut
            noDaftar: row[1], // row[1] is noDaftar
            nama: row[2], // row[2] is nama
            nilaiAkhir: score
          });
        }
      }

      const scores = processedStudents.map(s => s.nilaiAkhir).sort((a, b) => b - a);
      
      // Buat distribusi dengan interval 1 poin
      // Dynamic range calculation based on min/max scores
      const minScore = Math.floor(Math.min(...scores));
      const maxScore = Math.ceil(Math.max(...scores));

      type DistributionRow = {
        range: string;
        rangeLabel: string;
        count: number;
        percentage: string;
        start: number;
        isHighest?: boolean;
      };

      const distributionData: DistributionRow[] = [];
      for(let i = minScore; i <= maxScore; i += 1) {
        const count = scores.filter(score => score >= i && score < i + 1).length;
        
        if (count > 0 || (i >= 80 && i <= 95)) { // Include ranges with data or common high-score ranges
          distributionData.push({
            range: `${i}-${i+1}`,
            rangeLabel: `${i} - ${i+1}`,
            count: count,
            percentage: ((count / scores.length) * 100).toFixed(1),
            start: i,
            isHighest: false
          });
        }
      }
      
      // Tentukan rentang dengan kompetisi tertinggi (interval 1 poin)
      const maxCount = distributionData.length > 0 ? Math.max(...distributionData.map(d => d.count)) : 0;
      distributionData.forEach(d => {
        d.isHighest = d.count === maxCount && maxCount > 0;
      });

      // Statistik
      const statistics = {
        total: processedStudents.length,
        highest: scores.length > 0 ? Math.max(...scores) : 0,
        lowest: scores.length > 0 ? Math.min(...scores) : 0,
        average: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0.00',
        median: scores.length > 0 
          ? (scores.length % 2 === 0 
            ? ((scores[Math.floor(scores.length/2) - 1] + scores[Math.floor(scores.length/2)]) / 2).toFixed(2)
            : scores[Math.floor(scores.length/2)].toFixed(2))
          : '0.00'
      };

      setData(distributionData);
      setStats(statistics);
    };

    processData();
  }, [rawStudents]); // Re-run effect when rawStudents prop changes

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">Rentang Nilai: {label}</p>
          <p className="text-blue-600">
            <span className="font-medium">{payload[0].value} siswa</span>
            <span className="text-gray-500 ml-2">({data.percentage}%)</span>
          </p>
          {data.isHighest && (
            <p className="text-red-500 font-medium mt-1">🏆 Kompetisi Tertinggi</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Award className="text-blue-600" />
            Analisis Sebaran Nilai Akhir
          </h1>
          <h2 className="text-xl text-gray-600 mb-4">{schoolName || 'Seleksi SPMB 2025'}</h2>
          
          {/* Statistik Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Total Siswa</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <div>
                <p className="text-sm text-gray-600">Nilai Tertinggi</p>
                <p className="text-2xl font-bold text-green-600">{stats.highest}</p>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
              <div>
                <p className="text-sm text-gray-600">Nilai Terendah</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowest}</p>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
              <div>
                <p className="text-sm text-gray-600">Rata-rata</p>
                <p className="text-2xl font-bold text-purple-600">{stats.average}</p>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
              <div>
                <p className="text-sm text-gray-600">Median</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.median}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Distribusi */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            Distribusi Nilai Akhir (Interval 1 Poin)
          </h3>
          <div className="bg-gray-50 p-6 rounded-lg">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="rangeLabel" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6"
                  name="Jumlah Siswa"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isHighest ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart untuk menunjukkan kerapatan */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="text-red-600" />
            Kerapatan Kompetisi
          </h3>
          <div className="bg-gray-50 p-6 rounded-lg">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rangeLabel" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  fill="#93c5fd" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analisis Kompetisi */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border-l-4 border-red-500">
          <h3 className="text-xl font-semibold text-red-700 mb-4 flex items-center gap-2">
            🏆 Analisis Kompetisi Tertinggi
          </h3>
          <div className="space-y-3">
            {data.filter(d => d.isHighest).map((highestRange, index) => (
              <p key={index} className="text-gray-700">
                <span className="font-semibold text-red-600">Rentang {highestRange.range}:</span> Memiliki kompetisi tertinggi dengan 
                <span className="font-bold text-red-600"> {highestRange.count} siswa ({highestRange.percentage}%)</span> dari total peserta.
              </p>
            ))}
            
            {/* Tampilkan juga rentang dengan kompetisi tinggi (> 8 siswa) */}
            {data.filter(d => !d.isHighest && d.count >= 8)
                     .sort((a, b) => b.count - a.count)
                     .slice(0, 3)
                     .map((range, index) => (
                  <p key={index} className="text-gray-600 ml-4">
                    • <span className="font-medium">Rentang {range.range}:</span> {range.count} siswa ({range.percentage}%)
                  </p>
                ))}
            
            <p className="text-gray-600 text-sm bg-white p-3 rounded border-l-2 border-yellow-400">
              💡 <strong>Insight:</strong> Dengan interval 1 poin, analisis menunjukkan persebaran yang lebih detail. 
              Rentang dengan kerapatan tertinggi menunjukkan zona persaingan paling ketat dalam seleksi ini.
            </p>
          </div>
        </div>

        {/* Tabel Detail */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Detail Distribusi</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Rentang Nilai</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Jumlah Siswa</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Persentase</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Status Kompetisi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className={row.isHighest ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2 font-medium">{row.range}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.count}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.percentage}%</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {row.isHighest && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">Tertinggi 🏆</span>}
                      {row.count >= 10 && !row.isHighest && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">Tinggi</span>}
                      {row.count < 10 && row.count >= 6 && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">Sedang</span>}
                      {row.count < 6 && row.count > 0 && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">Rendah</span>}
                      {row.count === 0 && <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-sm font-medium">Tidak Ada</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ScoreAnalysis;