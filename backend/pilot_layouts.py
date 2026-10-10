import io
from datetime import datetime

import pandas as pd

from demo_data import build_demo, XLSX

LAYOUTS = {
    "s4_gst_register": "S/4HANA GST purchase register (ALV → XLSX, title rows, split IGST/CGST/SGST)",
    "b1_query_mdy": "SAP Business One query export (CSV, US MM/DD/YYYY dates, UI labels)",
    "ecc_technical": "SAP ECC table download (semicolon CSV, technical field names, YYYYMMDD, trailing minus)",
    "s4_fiori": "S/4HANA Fiori 'Manage Supplier Invoices' (XLSX, DD-Mon-YYYY, Indian digit grouping)",
}


def _d(s):
    return datetime.strptime(s, "%d.%m.%Y") if s != "31.11.2024" else None


def _inr(v):
    neg, v = v < 0, abs(v)
    whole, frac = f"{v:.2f}".split(".")
    head, tail = whole[:-3], whole[-3:]
    groups = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    if head:
        groups.insert(0, head)
    return ("-" if neg else "") + ",".join(groups + [tail]) + "." + frac if groups else ("-" if neg else "") + tail + "." + frac


def _split(gstin, tax):
    if gstin.startswith("27"):
        half = round(tax / 2, 2)
        return 0.0, half, round(tax - half, 2)
    return tax, 0.0, 0.0


def _fmt(s, fmt, bad="31/11/2024"):
    d = _d(s)
    return d.strftime(fmt) if d else bad


def build_layout(kind):
    sap, _ = build_demo()
    rows = sap.to_dict("records")
    if kind == "s4_gst_register":
        out = []
        for r in rows:
            tax = float(r["VatSum"])
            i, c, s = _split(r["LicTradNum"], tax)
            out.append({"Company Code": "IN01", "Vendor": r["CardCode"], "Vendor Name": r["CardName"],
                        "Vendor GSTIN No.": r["LicTradNum"], "Vendor Invoice No": r["NumAtCard"],
                        "Invoice Dt": r["TaxDate"], "Posting Dt": r["DocDate"],
                        "Assessable Value": float(r["BaseAmount"]), "IGST Amt": i, "CGST Amt": c, "SGST Amt": s,
                        "Invoice Amount": float(r["DocTotal"])})
        return _xlsx(pd.DataFrame(out), ["GST Purchase Register - Company Code IN01 (SANITIZED / FICTIONAL)",
                                         "Period 11.2024"]), "S4_GST_Purchase_Register_SANITIZED.xlsx", XLSX
    if kind == "b1_query_mdy":
        out = [{"BP Code": r["CardCode"], "BP Name": r["CardName"], "GSTIN": r["LicTradNum"],
                "Vendor Ref. No.": r["NumAtCard"], "Document Date": _fmt(r["TaxDate"], "%m/%d/%Y", "11/31/2024"),
                "Total Before Tax": r["BaseAmount"], "Tax Amount (LC)": r["VatSum"], "Document Total": r["DocTotal"]}
               for r in rows]
        return pd.DataFrame(out).to_csv(index=False).encode(), "B1_Query_AP_Invoices_SANITIZED.csv", "text/csv"
    if kind == "ecc_technical":
        out = [{"BUKRS": "IN01", "BELNR": f"51{r['DocNum']}", "GJAHR": "2024", "LIFNR": f"000{r['CardCode'][1:]}",
                "NAME1": r["CardName"], "STCD3": r["LicTradNum"], "XBLNR": r["NumAtCard"],
                "BLDAT": _fmt(r["TaxDate"], "%Y%m%d", "20241131"), "BUDAT": _fmt(r["DocDate"], "%Y%m%d"),
                "HWBAS": f"{float(r['BaseAmount']):.2f}-", "WMWST": f"{float(r['VatSum']):.2f}-"} for r in rows]
        return pd.DataFrame(out).to_csv(index=False, sep=";").encode(), "ECC_RBKP_BSET_Download_SANITIZED.csv", "text/csv"
    if kind == "s4_fiori":
        out = [{"Supplier Invoice": f"51{r['DocNum']}", "Fiscal Year": 2024, "Invoicing Party": r["CardCode"],
                "Invoicing Party Name": r["CardName"], "Tax Number 3": r["LicTradNum"], "Reference": r["NumAtCard"],
                "Invoice Date": _fmt(r["TaxDate"], "%d-%b-%Y", "31-Nov-2024"),
                "Net Amount": _inr(float(r["BaseAmount"])), "Tax Amount": _inr(float(r["VatSum"])),
                "Gross Invoice Amount": _inr(float(r["DocTotal"])), "Currency": "INR"} for r in rows]
        return _xlsx(pd.DataFrame(out)), "S4_Fiori_Supplier_Invoices_SANITIZED.xlsx", XLSX
    return None


def _xlsx(df, titles=None):
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        start = len(titles) + 1 if titles else 0
        df.to_excel(w, sheet_name="Data", index=False, startrow=start)
        for i, t in enumerate(titles or [], 1):
            w.sheets["Data"].cell(i, 1, t)
    return buf.getvalue()
