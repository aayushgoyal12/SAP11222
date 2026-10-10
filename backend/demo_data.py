import io
import random
import string
from datetime import date, timedelta

import pandas as pd

BUYER_STATE = "27"
VENDORS = [
    ("Apex Fasteners Pvt Ltd", "27", "APX"), ("Bluefin Packaging LLP", "29", "BFP"),
    ("Coral Electricals", "27", "CEL"), ("Deccan Logistics Pvt Ltd", "36", "DLG"),
    ("Evergreen Office Supplies", "27", "EOS"), ("Falcon Steel Traders", "24", "FST"),
    ("Granite IT Services", "29", "GIT"), ("Harbor Chemicals Ltd", "33", "HCL"),
    ("Indigo Print Works", "27", "IPW"), ("Juniper Facility Mgmt", "07", "JFM"),
    ("Kestrel Auto Components", "06", "KAC"), ("Lotus Industrial Gases", "27", "LIG"),
]
STATES = {"27": "Maharashtra", "29": "Karnataka", "36": "Telangana", "24": "Gujarat", "33": "Tamil Nadu",
          "07": "Delhi", "06": "Haryana"}


def _gstin(rng, state):
    L = string.ascii_uppercase
    pan = "".join(rng.choice(L) for _ in range(3)) + "C" + rng.choice(L) + f"{rng.randint(1000, 9999)}" + rng.choice(L)
    return f"{state}{pan}1Z{rng.choice(L + string.digits)}"


def build_demo():
    rng = random.Random(2024)
    vendors = [{"code": f"V{1001 + i}", "name": n, "state": st, "gstin": _gstin(rng, st), "prefix": p}
               for i, (n, st, p) in enumerate(VENDORS)]

    def invoice(i, v):
        taxable = round(rng.uniform(4000, 240000), 2)
        rate = rng.choice([5, 12, 18, 18, 18, 28])
        return {"v": v, "inv": f"{v['prefix']}/24-25/{100 + i:04d}", "date": date(2024, 11, 1) + timedelta(days=rng.randint(0, 28)),
                "taxable": taxable, "tax": round(taxable * rate / 100, 2)}

    base = [invoice(i, vendors[i % len(vendors)]) for i in range(36)]

    def sap_row(b, docnum, gstin=None, date_str=None):
        return {"DocNum": docnum, "DocDate": (b["date"] + timedelta(days=rng.randint(0, 4))).strftime("%d.%m.%Y"),
                "TaxDate": date_str or b["date"].strftime("%d.%m.%Y"), "CardCode": b["v"]["code"],
                "CardName": b["v"]["name"], "LicTradNum": gstin or b["v"]["gstin"], "NumAtCard": b["inv"],
                "BaseAmount": f"{b['taxable']:.2f}", "VatSum": f"{b['tax']:.2f}",
                "DocTotal": f"{b['taxable'] + b['tax']:.2f}", "Comments": f"AP Invoice - {b['v']['name']}"}

    def gst_row(b, inv=None, taxable=None, tax=None, d=None):
        taxable = b["taxable"] if taxable is None else taxable
        tax = b["tax"] if tax is None else tax
        if b["v"]["state"] == BUYER_STATE:
            half = round(tax / 2, 2)
            igst, cgst, sgst = 0, half, round(tax - half, 2)
        else:
            igst, cgst, sgst = tax, 0, 0
        return {"GSTIN of supplier": b["v"]["gstin"], "Trade/Legal name": b["v"]["name"].upper(),
                "Invoice number": inv or b["inv"], "Invoice type": "Regular",
                "Invoice Date": (d or b["date"]).strftime("%d-%m-%Y"), "Invoice Value(₹)": round(taxable + tax, 2),
                "Place of supply": STATES[BUYER_STATE], "Supply Attract Reverse Charge": "No",
                "Taxable Value (₹)": taxable, "Integrated Tax(₹)": igst, "Central Tax(₹)": cgst,
                "State/UT Tax(₹)": sgst, "Cess(₹)": 0, "GSTR-1/IFF/GSTR-5 Period": "Nov'24",
                "GSTR-1/IFF/GSTR-5 Filing Date": "11-12-2024", "ITC Availability": "Yes"}

    sap_rows, gst_rows = [], []
    for i, b in enumerate(base):
        docnum = 500100 + i
        if i == 34:
            sap_rows.append(sap_row(b, docnum, gstin=b["v"]["gstin"][:-1]))
            gst_rows.append(gst_row(b))
            continue
        if i == 35:
            sap_rows.append(sap_row(b, docnum, date_str="31.11.2024"))
            gst_rows.append(gst_row(b))
            continue
        sap_rows.append(sap_row(b, docnum))
        if i in (29, 30, 31):
            continue
        if i in (3, 7):
            gst_rows.append(gst_row(b, inv=b["inv"].replace("/", "-")))
        elif i in (5, 11):
            gst_rows.append(gst_row(b, tax=round(b["tax"] + 0.4, 2)))
        elif i == 26:
            gst_rows.append(gst_row(b, taxable=round(b["taxable"] + 1500, 2)))
        elif i == 27:
            gst_rows.append(gst_row(b, tax=round(b["tax"] - 270, 2)))
        elif i == 28:
            gst_rows.append(gst_row(b, taxable=round(b["taxable"] * 0.9, 2), tax=round(b["tax"] * 0.9, 2)))
        elif i == 32:
            gst_rows.append(gst_row(b, d=b["date"] + timedelta(days=3)))
        else:
            gst_rows.append(gst_row(b))
    sap_rows.append(sap_row(base[2], 500200))
    for j in range(2):
        gst_rows.append(gst_row(invoice(60 + j, vendors[4 + j])))
    rng.shuffle(gst_rows)
    return pd.DataFrame(sap_rows), pd.DataFrame(gst_rows)


def _xlsx(df, sheet, title_rows=None):
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        if title_rows:
            pd.DataFrame({"Read me": ["FICTIONAL DEMO DATA — generated for testing. Not a real GSTR-2B."]}).to_excel(
                w, sheet_name="Read me", index=False)
        start = len(title_rows) + 1 if title_rows else 0
        df.to_excel(w, sheet_name=sheet, index=False, startrow=start)
        ws = w.sheets[sheet]
        for i, t in enumerate(title_rows or [], 1):
            ws.cell(i, 1, t)
    return buf.getvalue()


GSTR_TITLES = ["Goods and Services Tax - GSTR-2B (FICTIONAL DEMO DATA)",
               "Taxable inward supplies received from registered persons - Nov 2024"]
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def demo_file(kind):
    sap, gst = build_demo()
    if kind == "sap_csv":
        return sap.to_csv(index=False).encode("utf-8"), "SAP_B1_AP_Invoices_Nov2024_FICTIONAL.csv", "text/csv"
    if kind == "sap_xlsx":
        return _xlsx(sap, "AP Invoices"), "SAP_B1_AP_Invoices_Nov2024_FICTIONAL.xlsx", XLSX
    if kind == "gstr2b_xlsx":
        return _xlsx(gst, "B2B", GSTR_TITLES), "GSTR2B_Nov2024_FICTIONAL.xlsx", XLSX
    if kind == "gstr2b_csv":
        return gst.to_csv(index=False).encode("utf-8"), "GSTR2B_Nov2024_FICTIONAL.csv", "text/csv"
    return None
