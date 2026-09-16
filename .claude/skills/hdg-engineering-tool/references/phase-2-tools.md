# Tool Fase 2 — Spesifikasi Awal

Belum diimplementasi. Semuanya mengikuti resep 7 langkah di SKILL.md, dan
angkanya wajib melewati prosedur verifikasi di skill `hdg-standards-config`
sebelum masuk config.

## Vent / Drain Hole Advisor

**Input:** tipe section (RHS/SHS/CHS/tangki/rangka tertutup), dimensi, panjang,
orientasi saat dicelup.
**Output:** jumlah, diameter minimum, dan posisi lubang (sudut diagonal — paling
atas dan paling bawah saat dicelup).

Sumber tabel: AS/NZS 4792, ASTM A385, publikasi AGA. Wajib diverifikasi ke
dokumen asli sebelum di-hardcode.

**Bukan sekadar kualitas — ini safety.** Rongga tertutup tanpa vent dapat
**meledak** di kettle karena uap air/udara mengembang pada ±450 °C. Output tool
wajib menyertakan peringatan ini, dan tool tidak pernah mengembalikan
"tidak perlu vent" untuk rongga tertutup.

## Zinc Pickup Estimator

**Input:** luas permukaan (m²), target ketebalan (µm), opsional faktor
reaktivitas baja.
**Output:** estimasi konsumsi zinc (kg), memakai `micronToGm2` dari
`lib/tools/units.ts`.

Estimasi ini untuk perencanaan biaya, bukan untuk jaminan proses. Konsumsi
nyata dipengaruhi dross, ash, dan reaktivitas baja.

## Kettle Fit Checker

**Input:** dimensi item (p × l × t), dimensi kettle galvanizer.
**Output:** muat / tidak muat / perlu **progressive (double) dipping**.

Bila hasilnya progressive dipping, output wajib menyebut konsekuensinya:
garis pertemuan yang terlihat, potensi perbedaan tampilan, dan risiko distorsi.

## Defect Photo Triage

**Input:** foto, opsional konteks (standar, kategori material, tebal baja).
**Output:** klasifikasi awal cacat (bare spot, dross protrusion, flux/ash
inclusion, wet storage stain, flaking, lumps/runs) + rujukan ke kriteria
inspeksi yang relevan.

**Selalu berlabel "indikatif".** Vision model tidak menggantikan inspeksi;
keputusan terima/tolak tetap pada inspector berwenang, dan verdict formal tetap
harus lewat pengukuran ketebalan dengan tool deterministik. Jangan pernah
mengembalikan "ACCEPT"/"REJECT" dari foto saja.
