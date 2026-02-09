#!/usr/bin/env python3
"""
Read `scripts/vendor_mapping.csv` and write a cleaned CSV to
`scripts/vendor_mapping_clean.csv` where embedded newlines inside fields
are replaced with spaces so Postgres COPY can import it.

This preserves quoting and commas by using Python's CSV module.
"""
import csv
import io
from pathlib import Path

IN = Path('scripts/vendor_mapping.csv')
OUT = Path('scripts/vendor_mapping_clean.csv')

with IN.open('r', encoding='utf-8', errors='replace', newline='') as fh_in:
    # Use csv.reader which handles quoted fields and embedded newlines when newline=''
    reader = csv.reader(fh_in)
    rows = list(reader)

clean_rows = []
for row in rows:
    # If row has fewer than 4 columns, pad; if more, join extras into last column
    if len(row) < 4:
        row = row + [''] * (4 - len(row))
    elif len(row) > 4:
        # join any extra columns into the last column
        row = row[:3] + [','.join(row[3:])]

    # Normalize newlines inside each cell
    row = [cell.replace('\n', ' ').replace('\r', ' ').strip() for cell in row]
    clean_rows.append(row)

OUT.parent.mkdir(parents=True, exist_ok=True)
with OUT.open('w', encoding='utf-8', newline='') as fh_out:
    writer = csv.writer(fh_out)
    writer.writerows(clean_rows)

print(f'Wrote cleaned CSV to {OUT}')
