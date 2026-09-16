# Checklist Verifikasi Standar

Diisi satu kali per standar per edisi, oleh engineer yang memegang salinan
dokumen standar yang sah. Simpan hasilnya bersama file config.

## Identitas

- [ ] Nama standar lengkap (mis. `ASTM A123/A123M`)
- [ ] Nomor edisi persis (mis. `A123/A123M-24`) — bukan "terbaru"
- [ ] Sumber salinan: dibeli / lisensi institusi / artikel resmi asosiasi
- [ ] Nama verifikator
- [ ] Tanggal verifikasi (YYYY-MM-DD)

## Angka

- [ ] Setiap sel tabel di config dicocokkan satu per satu ke dokumen asli
- [ ] Sel kosong di dokumen asli tercatat sebagai `null` di config, bukan
      diisi nilai terdekat
- [ ] Tabel konversi satuan (bila ada) dicocokkan
- [ ] Tidak ada angka yang berasal dari ringkasan pihak ketiga tanpa dicek ke
      dokumen asli

## Batas rentang — bagian paling rawan

- [ ] Setiap batas punya `min_incl` dan `max_incl` eksplisit di config
- [ ] Setiap batas dicocokkan ke simbol persis di dokumen (`<`, `≤`, `>`, `≥`)
- [ ] Titik batas yang ambigu di ringkasan web dicek ke teks standar
- [ ] Ada unit test untuk **setiap** titik batas, dan test itu gagal sebelum
      config diubah
- [ ] Untuk standar dengan dua sistem satuan (mm dan inci): batas metric dan
      imperial diverifikasi terpisah, tidak dikonversi satu dari yang lain

## Cakupan

- [ ] Kondisi yang **tidak** dicakup config ini didaftar eksplisit
      (mis. artikel centrifuged, fastener, rebar) beserta standar rujukannya
- [ ] Tool menolak input di luar cakupan, bukan memakai tabel terdekat

## Perubahan dari edisi sebelumnya

- [ ] Daftar setiap sel yang berubah nilainya
- [ ] Daftar kategori/rentang yang ditambah atau dihapus
- [ ] Setiap perubahan punya unit test yang menguncinya secara eksplisit
- [ ] Config edisi lama **tidak dihapus** (disimpan sebagai `.v1`, `.v2`, dst.)
- [ ] Chunk RAG dari artikel edisi lama diberi metadata `supersedes`
- [ ] Golden set ditambah kasus untuk setiap sel yang berubah

## Penutup

- [ ] `edition`, `verified_by`, `verified_at` terisi di file config
- [ ] Seluruh test hijau
- [ ] Flag `unverified` dihapus dari output tool untuk standar ini
