#!/bin/sh
# Gate: blokir `git commit` / `git push` sampai /code-review dan /simplify
# dijalankan untuk perubahan kode saat ini.
#
# Hook TIDAK bisa memanggil skill Claude. Yang bisa dilakukan hook adalah
# menolak perintahnya dan menyampaikan instruksi — Claude yang menjalankan
# skill-nya, lalu menulis fingerprint ke .claude/.review-done untuk membuka gate.
#
# Commit yang isinya hanya dokumentasi (md/txt, json di luar engineering-config)
# lewat tanpa gate. JSON di bawah packages/engineering-config/ dianggap kode —
# lihat aturan CLAUDE.md #2/#5/#6 soal disiplin angka standar.

payload=$(cat)
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

# Hanya gate git commit / git push. Perintah lain lolos.
# grep -E dipakai (bukan glob `case`) supaya flag di antara kata
# (mis. `git -c user.name=x commit`) tetap kena gate.
printf '%s' "$cmd" | grep -Eq '(^|[^[:alnum:]_-])git([^[:alnum:]_-].*)?[[:space:]](commit|push)([[:space:]]|$)' || exit 0

repo=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo" || exit 0

# File kode apa yang tersentuh? (staged + unstaged)
code=$( { git diff --cached --name-only; git diff --name-only; } \
        | grep -Ei '\.(ts|tsx|js|jsx|mjs|cjs|py|sh|sql|rs|go|java|rb)$|^packages/engineering-config/.*\.json$' \
        | sort -u )

# Tidak ada file kode -> dokumentasi saja -> lolos.
[ -z "$code" ] && exit 0

fingerprint=$(git diff HEAD | shasum | cut -d' ' -f1)
marker="$repo/.claude/.review-done"

# Sudah direview untuk perubahan persis ini -> lolos.
if [ -f "$marker" ] && [ "$(cat "$marker" 2>/dev/null)" = "$fingerprint" ]; then
  exit 0
fi

files=$(printf '%s' "$code" | tr '\n' ' ')
jq -n --arg fp "$fingerprint" --arg files "$files" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: (
      "GATE REVIEW: perubahan memuat file kode (" + $files + ") yang belum direview.\n\n" +
      "Jalankan berurutan sebelum commit/push:\n" +
      "  1. /code-review  — cari bug korektnes\n" +
      "  2. /simplify     — rapikan reuse & kompleksitas\n" +
      "  3. terapkan temuan yang valid\n" +
      "  4. buka gate:  echo " + $fp + " > .claude/.review-done\n\n" +
      "Fingerprint terikat ke diff saat ini; perubahan kode berikutnya menutup gate lagi."
    )
  }
}'
