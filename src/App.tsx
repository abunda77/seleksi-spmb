import { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Box } from '@mui/material';
import { SeleksiData, Student } from './types/seleksi';
import './App.css';

function App() {
  const [data, setData] = useState<SeleksiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchData = async () => {
      try {
        const res = await axios.get<SeleksiData>('https://bantulkab.spmb.id/seleksi/pr/smp/1-22040042-0.json');
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

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom color="primary.main">
        Seleksi Siswa SMPN 1 Banguntapan
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center">{error}</Typography>
      ) : data ? (
        <>
          <Typography variant="h6" gutterBottom>
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
                  <TableRow key={row[3]} hover>
                    <TableCell>{row[0]}</TableCell>
                    <TableCell>{row[3]}</TableCell>
                    <TableCell>{row[4]}</TableCell>
                    <TableCell>{row[5]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : null}
    </Container>
  );
}

export default App;
