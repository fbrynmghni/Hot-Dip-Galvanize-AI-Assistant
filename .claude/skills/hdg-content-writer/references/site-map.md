# Struktur Halaman & Komponen UI

```
/                      Landing: apa itu HDG, CTA "Tanya GalvaAI"
/learn
  /corrosion           Dasar korosi & ISO 9223
  /process             9 tahap proses (diagram interaktif)
  /metallurgy          Lapisan Gamma–Delta–Zeta–Eta
  /steel-selection     Si, P, Sandelin
  /design              Venting, distorsi, welding, masking
  /specifications      ASTM vs ISO vs AS/NZS (tabel pembanding)
  /inspection          Kriteria terima/tolak + galeri cacat
  /repair              ASTM A780, metode repair
  /duplex              Cat & powder di atas HDG
  /durability          Umur layanan & LCC
/glossary              Istilah (EN ↔ ID)
/tools                 Kalkulator
/chat                  AI Assistant
/sources               Daftar sumber & atribusi
```

## Persona pembaca per halaman

Menentukan kedalaman dan sudut penulisan.

| Persona | Halaman utama | Kebutuhan | Contoh pertanyaan |
|---|---|---|---|
| Structural / civil engineer | `/specifications`, `/durability` | Spesifikasi & durability | "Untuk pesisir C4, HDG 85 µm bertahan berapa lama?" |
| Fabricator | `/design` | Venting, distorsi, pengelasan | "Lubang vent untuk hollow section 100×100 perlu berapa?" |
| QC inspector | `/inspection`, `/repair` | Kriteria terima/tolak | "Wet storage stain itu reject atau tidak?" |
| Galvanizer / operator | `/process`, `/steel-selection` | Troubleshooting proses | "Kenapa coating over-thick di baja Si 0,08%?" |
| Procurement / owner | `/durability` | Biaya & life-cycle cost | "HDG vs cat epoxy, mana lebih murah dalam 50 tahun?" |
| Mahasiswa / pengajar | `/metallurgy`, `/corrosion` | Konsep dasar | "Jelaskan lapisan Gamma, Delta, Zeta, Eta." |

## Komponen UI chat

- Streaming jawaban + kartu sitasi (judul, sumber AGA/GAA, link)
- Badge "dihitung oleh tool" pada angka hasil kalkulator
- Suggested questions per halaman (kontekstual, difilter dari `topics` chunk)
- **Standard Selector** — disimpan di state, dikirim ke `/api/chat`, dan
  disimpan di URL (`?std=ASTM_A123`) supaya hasil bisa dibagikan
- Tombol feedback 👍/👎 + alasan

## Halaman `/tools/coating-thickness`

```
┌─ Standar ketebalan coating ───────────────────────────────┐
│ ( ) ASTM A123     ( ) ISO 1461     ( ) AS/NZS 4680        │
│ [ ] Bandingkan ketiganya                                  │
├───────────────────────────────────────────────────────────┤
│ Jika ASTM A123:                                           │
│   Kategori material [Structural Shapes ▼] (7 pilihan)     │
│   Tebal baja terukur [ 10 ] [mm ▼ | in] ⓘ bagian tertipis │
│ Jika ISO 1461:                                            │
│   Tebal baja [ 10 ] mm   [ ] Casting                      │
│ Jika AS/NZS 4680:                                         │
│   Tebal baja [ 10 ] mm                                    │
├───────────────────────────────────────────────────────────┤
│ Pembacaan (opsional): + Specimen / + Reference area       │
│   #1 [130] [140] [135]                                    │
├───────────────────────────────────────────────────────────┤
│ HASIL:  ASTM A123 → Grade 100 (100 µm / 3,9 mils)         │
│         Individu min: Grade 85 · Verdict: CONFORMS ✅     │
│         Sumber: ASTM A123/A123M (edisi …)                 │
└───────────────────────────────────────────────────────────┘
```

Field form **berubah otomatis** sesuai standar — field kategori material hanya
muncul untuk ASTM. Ini mencerminkan `discriminatedUnion` di skema tool: bentuk
input yang berbeda per standar, bukan satu form dengan field opsional.

```tsx
// components/StandardSelector.tsx
"use client";
export type ThicknessStandard = "ASTM_A123" | "ISO1461" | "ASNZS4680";

const OPTIONS: { value: ThicknessStandard; label: string; hint: string }[] = [
  { value: "ASTM_A123", label: "ASTM A123-24", hint: "Grade per kategori material (AGA)" },
  { value: "ISO1461",   label: "ISO 1461",     hint: "Local & mean, internasional" },
  { value: "ASNZS4680", label: "AS/NZS 4680",  hint: "Australia & NZ (GAA)" },
];

export function StandardSelector({ value, onChange }: {
  value: ThicknessStandard | null;
  onChange: (v: ThicknessStandard) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Standar ketebalan coating" className="grid gap-2 sm:grid-cols-3">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg border p-3 text-left ${value === o.value ? "border-zinc-900 bg-zinc-100" : "border-zinc-300"}`}
        >
          <div className="font-medium">{o.label}</div>
          <div className="text-xs text-zinc-500">{o.hint}</div>
        </button>
      ))}
    </div>
  );
}
```
