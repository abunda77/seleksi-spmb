import { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Box, TextField, InputAdornment } from '@mui/material';
import type { SeleksiData, Student } from './types/seleksi';
import './App.css';

function App() {
  const [data, setData] = useState<SeleksiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nilaiPrediksi, setNilaiPrediksi] = useState<string>('');
  const [prediksiPeringkat, setPrediksiPeringkat] = useState<number | null>(null);
  const [hoverData, setHoverData] = useState<any[] | null>(null);
  const [hoverAnchor, setHoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedNoDaftar, setSelectedNoDaftar] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const fetchData = async () => {
      try {
        const res = await axios.get<SeleksiData>('/seleksi/pr/smp/1-22040042-0.json');
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

  useEffect(() => {
    if (!data || !nilaiPrediksi) {
      setPrediksiPeringkat(null);
      return;
    }
    // Cari peringkat prediksi
    const nilai = parseFloat(nilaiPrediksi.replace(',', '.'));
    if (isNaN(nilai)) {
      setPrediksiPeringkat(null);
      return;
    }
    // Urutkan data dari terbesar ke terkecil
    const sorted = [...data.data].sort((a, b) => parseFloat(b[5]) - parseFloat(a[5]));
    // Cari posisi prediksi
    const idx = sorted.findIndex(row => nilai >= parseFloat(row[5]));
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

  const handleClickOutside = (event: React.MouseEvent) => {
    setHoverAnchor(null);
    setHoverData(null);
    setSelectedNoDaftar(null);
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom color="primary.main">
        Seleksi Siswa SMPN 1 Banguntapan 
      </Typography>
      <Typography variant="h4" fontWeight={700} gutterBottom color="primary.main">
        Jalur Prestasi 
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
          <Typography variant="h6" gutterBottom sx={{ color: '#222', textShadow: '0 1px 0 #fff' }}>
            {data.sekolah.nama} ({data.sekolah.kota}, {data.sekolah.propinsi})
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)' }}>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Urut</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>No Daftar</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Nama</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Nilai Akhir</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((row: Student) => (
                  <TableRow
                    key={row[3]}
                    hover
                    onClick={e => handleRowClick(e, row[3])}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: selectedNoDaftar === row[3] ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                    }}
                    data-no-daftar={row[3]}
                  >
                    <TableCell>{row[0]}</TableCell>
                    <TableCell>{row[3]}</TableCell>
                    <TableCell>{row[4]}</TableCell>
                    <TableCell>{row[5]}</TableCell>
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

        </>
      ) : null}
    </Container>
  );
}

export default App;
