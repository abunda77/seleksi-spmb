export interface School {
  sekolah_id: string;
  siap_id: string;
  nama: string;
  npsn: string;
  is_negeri: boolean;
  is_sbi: boolean;
  k_kota: number;
  k_propinsi: number;
  kota: string;
  propinsi: string;
}

export interface Student {
  0: number;      // Urut
  1: string;      // No Daftar
  2: string;      // Nama
  3: string;      // Wilayah
  4: string;      // Nilai Akhir
  5: string;      // Status
  6: string;      // Waktu Daftar
}

export interface SeleksiData {
  sekolah: School;
  kompetensi: string;
  enable: boolean;
  jml_pagu: string;
  jml_luar: number;
  data: Student[];
}
