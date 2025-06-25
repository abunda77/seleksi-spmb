import { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Box, TextField, InputAdornment, Button } from '@mui/material';
import type { SeleksiData, Student } from './types/seleksi';
import './App.css';
import ScoreAnalysis from './ScoreAnalysis';

function App() {
  const [data, setData] = useState<SeleksiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nilaiPrediksi, setNilaiPrediksi] = useState<string>('');
  const [prediksiPeringkat, setPrediksiPeringkat] = useState<number | null>(null);
  const [hoverData, setHoverData] = useState<any[] | null>(null);
  const [hoverAnchor, setHoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedNoDaftar, setSelectedNoDaftar] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const fetchData = async () => {
      try {
        const res = await axios.get<SeleksiData>('seleksi/wilayah/smp/1-22040007-0.json');
        setData(res.data);
        setError(null);
      } catch (err: any) {
        setError('Gagal memuat data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    interval = setInterval(fetchData, 5000); // realtime refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // Update: indeks kolom sesuai format baru
  const getUrut = (row: any[]) => row[0];
  const getNoDaftar = (row: any[]) => row[1];
  const getNama = (row: any[]) => row[2];
  const getWilayah = (row: any[]) => row[3];
  const getNilaiAkhir = (row: any[]) => parseFloat(row[4]);
  const getStatus = (row: any[]) => row[5];
  const getWaktuDaftar = (row: any[]) => row[6];

  // Update prediksi peringkat
  useEffect(() => {
    if (!data || !nilaiPrediksi) {
      setPrediksiPeringkat(null);
      return;
    }
    const nilai = parseFloat(nilaiPrediksi.replace(',', '.'));
    if (isNaN(nilai)) {
      setPrediksiPeringkat(null);
      return;
    }
    // Urutkan data dari terbesar ke terkecil berdasarkan nilai akhir (indeks 4)
    const sorted = [...data.data].sort((a, b) => getNilaiAkhir(b) - getNilaiAkhir(a));
    const idx = sorted.findIndex(row => nilai >= getNilaiAkhir(row));
    setPrediksiPeringkat(idx === -1 ? sorted.length + 1 : idx + 1);
  }, [nilaiPrediksi, data]);

  const handleRowClick = async (event: React.MouseEvent<HTMLElement>, noDaftar: string) => {
    event.stopPropagation(); // Prevent container click

    // Toggle: jika sudah terbuka untuk row yang sama, tutup
    if (selectedNoDaftar === noDaftar) {
      setHoverAnchor(null);
      setHoverData(null);
      setSelectedNoDaftar(null);
      return;
    }

    setHoverAnchor(event.currentTarget);
    setHoverData(null); // Reset data saat loading
    setSelectedNoDaftar(noDaftar);

    try {
      const res = await axios.get<any[]>(`/api/cari?no_daftar=${noDaftar}`);

      // Parse seluruh response untuk mencari biodata siswa
      const fullData = res.data.join(',');

      // Cari section "Biodata Siswa" dan ambil data setelahnya
      const biodataStart = fullData.indexOf('Biodata Siswa');
      if (biodataStart !== -1) {
        // Ambil data setelah "Biodata Siswa" sampai section berikutnya
        const afterBiodata = fullData.substring(biodataStart);
        const items = afterBiodata.split(',');

        const parsedData = [];
        let i = 1; // Skip "Biodata Siswa" header

        while (i < items.length) {
          // Cari pattern: fieldname, "field", label, value
          if (items[i+1] === 'field' && items[i+2] && items[i+3]) {
            parsedData.push([
              items[i],      // field name
              items[i+1],    // type (field)
              items[i+2],    // label
              items[i+3]     // value
            ]);
            i += 4;
          } else if (items[i] === 'head') {
            // Skip header sections
            break;
          } else {
            i++;
          }
        }

        setHoverData(parsedData);
      } else {
        setHoverData(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setHoverData(null);
    }
  };

  const handleClickOutside = () => {
    setHoverAnchor(null);
    setHoverData(null);
    setSelectedNoDaftar(null);
  };

  const handleExportCSV = () => {
    if (!data || !data.data || data.data.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    // Header CSV dengan informasi sekolah
    const schoolInfo = `# Data Seleksi ${data.sekolah.nama}`;
    const locationInfo = `# Lokasi: ${data.sekolah.kota}, ${data.sekolah.propinsi}`;
    const exportInfo = `# Diekspor pada: ${new Date().toLocaleString('id-ID')}`;
    const totalInfo = `# Total Siswa: ${data.data.length}`;

    const headers = ['Urut', 'No Daftar', 'Nama', 'Wilayah', 'Nilai Akhir', 'Waktu Daftar'];

    // Convert data to CSV format
    const csvContent = [
      schoolInfo,
      locationInfo,
      exportInfo,
      totalInfo,
      '', // Empty line
      headers.join(','), // Header row
      ...data.data.map((row: any[]) => [
        getUrut(row),
        `"${getNoDaftar(row)}"`,
        `"${getNama(row)}"`,
        `"${getWilayah(row)}"`,
        getNilaiAkhir(row),
        `"${getWaktuDaftar(row)}"`
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const fileName = `seleksi-spmb-${data.sekolah.nama.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      alert(`Data berhasil diekspor ke file: ${fileName}`);
    }
  };

  // Export analisa data detail
  const handleExportAnalysis = () => {
    if (!data || !data.data || data.data.length === 0) {
      alert('Tidak ada data untuk dianalisa');
      return;
    }

    const basicAnalysis = calculateAnalysis();
    const detailedAnalysis = getDetailedAnalysis();

    if (!basicAnalysis || !detailedAnalysis) {
      alert('Gagal menganalisa data');
      return;
    }

    // Header analisa
    const analysisContent = [
      `# ANALISA DATA SELEKSI ${data.sekolah.nama.toUpperCase()}`,
      `# Lokasi: ${data.sekolah.kota}, ${data.sekolah.propinsi}`,
      `# Tanggal Analisa: ${new Date().toLocaleString('id-ID')}`,
      `# Total Peserta: ${basicAnalysis.total}`,
      '',
      '## STATISTIK DASAR',
      `Nilai Tertinggi,${basicAnalysis.highest}`,
      `Nilai Terendah,${basicAnalysis.lowest}`,
      `Rata-rata,${basicAnalysis.average}`,
      `Median,${basicAnalysis.median}`,
      `Kuartil 1 (Q1),${basicAnalysis.q1}`,
      `Kuartil 3 (Q3),${basicAnalysis.q3}`,
      `Standar Deviasi,${basicAnalysis.standardDeviation}`,
      `Tingkat Kelulusan (≥60),${basicAnalysis.passRate}%`,
      '',
      '## ZONA AMAN PREDIKSI',
      `Top 10% (${detailedAnalysis.safeZones.top10.count} siswa),≥${detailedAnalysis.safeZones.top10.threshold}`,
      `Top 25% (${detailedAnalysis.safeZones.top25.count} siswa),≥${detailedAnalysis.safeZones.top25.threshold}`,
      `Top 50% (${detailedAnalysis.safeZones.top50.count} siswa),≥${detailedAnalysis.safeZones.top50.threshold}`,
      `Estimasi Cut-off (50%),${detailedAnalysis.estimatedCutOff}`,
      '',
      '## DISTRIBUSI NILAI',
      'Rentang,Jumlah Siswa,Persentase',
      ...basicAnalysis.ranges.map(range => `${range.label},${range.count},${((range.count/basicAnalysis.total)*100).toFixed(1)}%`),
      '',
      '## ANALISA PERSAINGAN KETAT (Gap ≤0.5)',
      'Peringkat 1,Nilai 1,Peringkat 2,Nilai 2,Gap',
      ...detailedAnalysis.competitionAnalysis.map(comp =>
        `${comp.rank1},${comp.score1},${comp.rank2},${comp.score2},${comp.gap}`
      ),
      '',
      '## INSIGHT PERSAINGAN',
      `Total Persaingan Ketat,${detailedAnalysis.insights.totalTightRaces} pasang`,
      `Gap Rata-rata,${detailedAnalysis.insights.averageGap}`,
      detailedAnalysis.insights.mostCompetitive
        ? `Persaingan Terketat,Peringkat ${detailedAnalysis.insights.mostCompetitive.rank1} vs ${detailedAnalysis.insights.mostCompetitive.rank2} (Gap: ${detailedAnalysis.insights.mostCompetitive.gap})`
        : 'Persaingan Terketat,Tidak ada',
      '',
      '## OUTLIERS',
      `Nilai Sangat Tinggi (>μ+2σ),${detailedAnalysis.outliers.high.length} siswa`,
      `Nilai Sangat Rendah (<μ-2σ),${detailedAnalysis.outliers.low.length} siswa`,
      '',
      '## TREND DISTRIBUSI (Per 5 Poin)',
      'Rentang,Jumlah,Persentase',
      ...detailedAnalysis.trendAnalysis.map(trend =>
        `${trend.range},${trend.count},${trend.percentage}%`
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([analysisContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const fileName = `analisa-seleksi-${data.sekolah.nama.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Analisa data berhasil diekspor ke file: ${fileName}`);
    }
  };

  const calculateAnalysis = () => {
    if (!data || !data.data || data.data.length === 0) {
      return null;
    }

    const scores = data.data.map((row: Student) => parseFloat(row[4]));
    const sortedScores = [...scores].sort((a, b) => b - a);

    // Statistik dasar
    const total = scores.length;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = sum / total;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    // Median
    const median = sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)];

    // Quartiles
    const q1Index = Math.floor(total * 0.25);
    const q3Index = Math.floor(total * 0.75);
    const q1 = sortedScores[q1Index];
    const q3 = sortedScores[q3Index];

    // Standard deviation
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) / total;
    const standardDeviation = Math.sqrt(variance);

    // Distribusi nilai
    const ranges = [
      { label: '90-100', min: 90, max: 100, count: 0 },
      { label: '80-89.99', min: 80, max: 89.99, count: 0 },
      { label: '70-79.99', min: 70, max: 79.99, count: 0 },
      { label: '60-69.99', min: 60, max: 69.99, count: 0 },
      { label: '<60', min: 0, max: 59.99, count: 0 }
    ];

    scores.forEach(score => {
      ranges.forEach(range => {
        if (score >= range.min && score <= range.max) {
          range.count++;
        }
      });
    });

    // Persentase kelulusan (asumsi passing grade 60)
    const passCount = scores.filter(score => score >= 60).length;
    const passRate = (passCount / total) * 100;

    return {
      total,
      average: parseFloat(average.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      highest,
      lowest,
      q1: parseFloat(q1.toFixed(2)),
      q3: parseFloat(q3.toFixed(2)),
      standardDeviation: parseFloat(standardDeviation.toFixed(2)),
      ranges,
      passCount,
      passRate: parseFloat(passRate.toFixed(2))
    };
  };

  // Fungsi analisa data tambahan
  const getDetailedAnalysis = () => {
    if (!data || !data.data || data.data.length === 0) {
      return null;
    }

    const scores = data.data.map((row: Student) => parseFloat(row[4]));
    const sortedScores = [...scores].sort((a, b) => b - a);
    const total = scores.length;

    // Analisa persaingan ketat (gap kecil antar nilai)
    const competitionAnalysis = [];
    for (let i = 0; i < sortedScores.length - 1; i++) {
      const gap = sortedScores[i] - sortedScores[i + 1];
      if (gap <= 0.5) { // Gap kecil menunjukkan persaingan ketat
        competitionAnalysis.push({
          rank1: i + 1,
          rank2: i + 2,
          score1: sortedScores[i],
          score2: sortedScores[i + 1],
          gap: parseFloat(gap.toFixed(2))
        });
      }
    }

    // Analisa zona aman (top 10%, 25%, 50%)
    const safeZones = {
      top10: {
        threshold: sortedScores[Math.floor(total * 0.1)],
        count: Math.floor(total * 0.1),
        percentage: 10
      },
      top25: {
        threshold: sortedScores[Math.floor(total * 0.25)],
        count: Math.floor(total * 0.25),
        percentage: 25
      },
      top50: {
        threshold: sortedScores[Math.floor(total * 0.5)],
        count: Math.floor(total * 0.5),
        percentage: 50
      }
    };

    // Analisa outliers (nilai yang sangat tinggi/rendah)
    const average = scores.reduce((a, b) => a + b, 0) / total;
    const stdDev = Math.sqrt(scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) / total);

    const outliers = {
      high: scores.filter(score => score > average + 2 * stdDev),
      low: scores.filter(score => score < average - 2 * stdDev)
    };

    // Prediksi cut-off berdasarkan kuota (asumsi 50% diterima)
    const estimatedCutOff = sortedScores[Math.floor(total * 0.5)];

    // Analisa trend nilai (distribusi per 5 poin)
    const trendAnalysis = [];
    for (let i = Math.floor(Math.min(...scores) / 5) * 5; i <= Math.ceil(Math.max(...scores) / 5) * 5; i += 5) {
      const count = scores.filter(score => score >= i && score < i + 5).length;
      if (count > 0) {
        trendAnalysis.push({
          range: `${i}-${i + 4.99}`,
          count,
          percentage: parseFloat(((count / total) * 100).toFixed(1))
        });
      }
    }

    return {
      competitionAnalysis: competitionAnalysis.slice(0, 10), // Top 10 persaingan terketat
      safeZones,
      outliers,
      estimatedCutOff: parseFloat(estimatedCutOff.toFixed(2)),
      trendAnalysis,
      insights: {
        mostCompetitive: competitionAnalysis.length > 0 ? competitionAnalysis[0] : null,
        averageGap: competitionAnalysis.length > 0
          ? parseFloat((competitionAnalysis.reduce((sum, item) => sum + item.gap, 0) / competitionAnalysis.length).toFixed(2))
          : 0,
        totalTightRaces: competitionAnalysis.length
      }
    };
  };



  return (
    <Container>
      <Typography variant="h4" fontWeight={700} gutterBottom color="primary.main">
        Seleksi Siswa SMPN 
      </Typography>
      <Typography variant="h4" fontWeight={700} gutterBottom color="primary.main">
        Jalur Wilayah
      </Typography>
      <Box mb={4} display="flex" flexDirection="column" alignItems="center">
        <TextField
          label="Prediksi Nilai Akhir"
          variant="outlined"
          value={nilaiPrediksi}
          onChange={e => setNilaiPrediksi(e.target.value.replace(/[^\d.,]/g, ''))}
          sx={{ width: 260, mb: 1 }}
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">poin</InputAdornment>,
              inputProps: { inputMode: 'decimal', pattern: '[0-9.,]*' },
            }
          }}
        />
        {prediksiPeringkat !== null && (
          <Typography variant="subtitle1" color="secondary" fontWeight={600}>
            Prediksi Peringkat: <span style={{ color: '#1976d2' }}>{prediksiPeringkat}</span>
          </Typography>
        )}
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center">{error}</Typography>
      ) : data ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#222', textShadow: '0 1px 0 #fff' }}>
              {data.sekolah.nama} ({data.sekolah.kota}, {data.sekolah.propinsi})
            </Typography>
            <Button
              variant="contained"
              onClick={handleExportCSV}
              sx={{
                bgcolor: '#059669',
                '&:hover': {
                  bgcolor: '#047857',
                  boxShadow: '0 6px 8px -1px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)'
                },
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              � Export CSV
            </Button>
            <Button
              variant="contained"
              onClick={handleExportAnalysis}
              sx={{
                bgcolor: '#7c3aed',
                '&:hover': {
                  bgcolor: '#6d28d9',
                  boxShadow: '0 6px 8px -1px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)'
                },
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease-in-out',
                ml: 2
              }}
            >
              📊 Export Analisa
            </Button>
          </Box>

          {/* Quick Insights */}
          {(() => {
            const analysis = calculateAnalysis();
            const detailedAnalysis = getDetailedAnalysis();
            if (!analysis || !detailedAnalysis) return null;

            return (
              <Box sx={{ mb: 3, p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1e293b', fontWeight: 600 }}>
                  📈 Insight Cepat
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" color="#64748b">Rata-rata Nilai</Typography>
                    <Typography variant="h6" color="#0f172a" fontWeight={600}>{analysis.average}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" color="#64748b">Zona Aman Top 25%</Typography>
                    <Typography variant="h6" color="#059669" fontWeight={600}>≥{detailedAnalysis.safeZones.top25.threshold}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" color="#64748b">Estimasi Cut-off</Typography>
                    <Typography variant="h6" color="#dc2626" fontWeight={600}>{detailedAnalysis.estimatedCutOff}</Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" color="#64748b">Persaingan Ketat</Typography>
                    <Typography variant="h6" color="#7c3aed" fontWeight={600}>{detailedAnalysis.insights.totalTightRaces} pasang</Typography>
                  </Box>
                </Box>
                {detailedAnalysis.insights.mostCompetitive && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#fef3c7', borderRadius: 1, border: '1px solid #f59e0b' }}>
                    <Typography variant="body2" color="#92400e">
                      🏆 <strong>Persaingan Terketat:</strong> Peringkat {detailedAnalysis.insights.mostCompetitive.rank1} vs {detailedAnalysis.insights.mostCompetitive.rank2}
                      (Gap: {detailedAnalysis.insights.mostCompetitive.gap} poin)
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })()}

          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)' }}>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Urut</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>No Daftar</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Nama</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Wilayah</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Nilai Akhir</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Waktu Daftar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((row: any[]) => (
                  <TableRow
                    key={getNoDaftar(row)}
                    hover
                    onClick={e => handleRowClick(e, getNoDaftar(row))}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: selectedNoDaftar === getNoDaftar(row) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                    }}
                    data-no-daftar={getNoDaftar(row)}
                  >
                    <TableCell>{getUrut(row)}</TableCell>
                    <TableCell>{getNoDaftar(row)}</TableCell>
                    <TableCell>{getNama(row)}</TableCell>
                    <TableCell>{getWilayah(row)}</TableCell>
                    <TableCell>{getNilaiAkhir(row)}</TableCell>
                    <TableCell>{getWaktuDaftar(row)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {hoverAnchor && (
            <>
              {/* Backdrop */}
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 1299,
                }}
                onClick={handleClickOutside}
              />

              {/* Popup */}
              <Box
                sx={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1300,
                  width: 520,
                  bgcolor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: 2,
                  boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  p: 3,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                  color: '#111827',
                }}
                onClick={e => e.stopPropagation()}
              >
              <Typography
                variant="h6"
                fontWeight={600}
                color="#6b7280"
                mb={2.5}
                sx={{
                  fontSize: 16,
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  borderBottom: '1px solid #e5e7eb',
                  pb: 1
                }}
              >
                Biodata Siswa
              </Typography>
              {hoverData ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {Array.isArray(hoverData) && hoverData.length > 0 ? (
                    hoverData.map((item, idx) => {
                      // Pastikan item adalah array dengan struktur yang benar
                      if (!Array.isArray(item) || item.length < 4) {
                        return null;
                      }

                      const label = item[2] || 'Field';
                      const value = Array.isArray(item[3]) ? item[3][0] : item[3];

                      return (
                        <Box
                          key={idx}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '140px 1fr',
                            gap: 2,
                            alignItems: 'start',
                            py: 0.5
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="#6b7280"
                            sx={{
                              fontSize: 14,
                              fontWeight: 400,
                              textAlign: 'left',
                              lineHeight: 1.5
                            }}
                          >
                            {label}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="#374151"
                            sx={{
                              fontSize: 14,
                              fontWeight: 500,
                              textAlign: 'left',
                              lineHeight: 1.5,
                              wordBreak: 'break-word'
                            }}
                          >
                            {value || '-'}
                          </Typography>
                        </Box>
                      );
                    }).filter(Boolean)
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      Tidak ada data.
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60px">
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
            </>
          )}
          <Box mt={6}>
            <ScoreAnalysis students={data.data} schoolName={data.sekolah.nama} />
          </Box>
        </>
      ) : null}
    </Container>
  );
}

export default App;
