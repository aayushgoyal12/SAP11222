import time

import recon
from demo_data import demo_file
from pilot_layouts import LAYOUTS, build_layout

FORMAT_HINT = {"b1_query_mdy": "MDY"}


def run(absolute=False):
    g_bytes, g_name, _ = demo_file("gstr2b_xlsx")
    gst = recon.read_table(g_bytes, g_name)
    gmap, _ = recon.auto_map(gst["columns"])
    for kind, desc in LAYOUTS.items():
        content, name, _ = build_layout(kind)
        t = recon.read_table(content, name)
        m, conf = recon.auto_map(t["columns"])
        mapped = {c for c in m.values() if c}
        unrecognised = [c for c in t["columns"] if c not in mapped]
        errs = recon.validate_mapping(m, t["columns"], "SAP")
        print(f"\n== {kind}: {desc}\n   header row {t['header_row']}, {len(t['rows'])} rows")
        print("   mapping:", {k: f"{v} ({conf[k]})" for k, v in m.items() if v})
        print("   unrecognised columns:", unrecognised)
        if errs:
            print("   BLOCKED:", errs)
            continue
        start = time.time()
        _, s, _ = recon.reconcile(t, gst, m, gmap, 1.0, FORMAT_HINT.get(kind, "AUTO"), "AUTO", "GSTR-2B",
                                  absolute)
        print(f"   matched {s['matched']}/{s['total_records']} | mismatch {s['amount_mismatch']} | invalid "
              f"{s['invalid']} | missing {s['missing_in_cmp']} | {int((time.time() - start) * 1000)} ms")


if __name__ == "__main__":
    run()
