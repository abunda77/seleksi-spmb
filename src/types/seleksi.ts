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
  1: number;      // Unknown
  2: number;      // Unknown
  3: string;      // No Daftar
  4: string;      // Nama
  5: string;      // Nilai Akhir
  6: string;      // Unknown
  7: string;      // Age
}

export interface SeleksiData {
  sekolah: School;
  kompetensi: string;
  enable: boolean;
  jml_pagu: string;
  jml_luar: number;
  data: Student[];
}
