#!/bin/sh
# Cek model yang tersedia di akun OpenAI, baca kunci dari .env
KEY=$(grep -E '^OPENAI_API_KEY=' .env | cut -d= -f2- | tr -d '"'"'"' ')
curl -s https://api.openai.com/v1/models -H "Authorization: Bearer $KEY" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['error']['message']) if 'error' in d else print('\n'.join(sorted(m['id'] for m in d['data'])))"
