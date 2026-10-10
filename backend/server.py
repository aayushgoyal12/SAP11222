import io
import logging
import os
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from starlette.middleware.cors import CORSMiddleware

import recon
import demo_data
import pilot_layouts

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
RETENTION_DAYS = int(os.environ['RETENTION_DAYS'])
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
CMP_LABELS = {"gstr2b": "GSTR-2B", "purchase_register": "Purchase Register"}

app = FastAPI()
api = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


def now():
    return datetime.now(timezone.utc)


def event(action, detail=""):
    return {"at": now().isoformat(), "action": action, "detail": detail}


class BaseDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    @classmethod
    def from_mongo(cls, doc):
        d = dict(doc)
        d["id"] = str(d.pop("_id"))
        return cls(**d)

    def to_mongo(self):
        d = self.model_dump()
        d["_id"] = d.pop("id")
        return d


class FileMeta(BaseModel):
    filename: str
    sheet: str
    header_row: int
    columns: List[str]
    row_count: int
    preview: List[List[str]]
    suggested_mapping: Dict[str, Optional[str]]
    confidence: Dict[str, str]
    suggested_date_format: Optional[str] = None
    suggested_absolute: Optional[bool] = None


class Job(BaseDocument):
    name: str
    mode: str = "sap_export"
    comparison_type: str
    is_demo: bool = False
    status: str = "uploaded"
    sap: FileMeta
    comparison: FileMeta
    mapping: Optional[Dict[str, Dict[str, Optional[str]]]] = None
    settings: Optional[dict] = None
    summary: Optional[dict] = None
    assumptions: List[str] = []
    events: List[dict] = []
    created_at: datetime
    expires_at: datetime


class MappingTemplate(BaseDocument):
    name: str
    side: str
    mapping: Dict[str, Optional[str]]
    created_at: datetime


class TemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    side: str = Field(pattern="^(sap|comparison)$")
    mapping: Dict[str, Optional[str]]


class ReconcileRequest(BaseModel):
    sap_mapping: Dict[str, Optional[str]]
    cmp_mapping: Dict[str, Optional[str]]
    tolerance: float = Field(1.0, ge=0, le=1000000)
    sap_date_format: str = Field("AUTO", pattern="^(AUTO|DMY|MDY|YMD)$")
    cmp_date_format: str = Field("AUTO", pattern="^(AUTO|DMY|MDY|YMD)$")
    absolute_amounts: bool = False


class ReviewUpdate(BaseModel):
    reviewed: bool
    review_note: str = Field("", max_length=1000)


def file_meta(filename, t):
    mapping, conf = recon.auto_map(t["columns"])
    meta = FileMeta(filename=filename, sheet=t["sheet"], header_row=t["header_row"], columns=t["columns"],
                    row_count=len(t["rows"]), preview=t["rows"][:5], suggested_mapping=mapping, confidence=conf)
    idx = {k: t["columns"].index(c) for k, c in mapping.items() if c}
    if "invoice_date" in idx:
        meta.suggested_date_format = recon.detect_date_format([r[idx["invoice_date"]] for r in t["rows"][:200]])
    if "taxable_value" in idx:
        meta.suggested_absolute = recon.detect_negative_amounts([r[idx["taxable_value"]] for r in t["rows"]])
    return meta


async def get_job(job_id) -> Job:
    doc = await db.jobs.find_one({"_id": job_id})
    if not doc:
        raise HTTPException(404, "Job not found or already deleted by retention policy")
    return Job.from_mongo(doc)


async def create_job(sap_bytes, sap_name, cmp_bytes, cmp_name, comparison_type, is_demo):
    if comparison_type not in CMP_LABELS:
        raise HTTPException(400, "comparison_type must be gstr2b or purchase_register")
    tables = {}
    for side, label, content, name in (("sap", "SAP export", sap_bytes, sap_name),
                                       ("comparison", CMP_LABELS[comparison_type], cmp_bytes, cmp_name)):
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(400, f"{label}: file exceeds 15 MB limit")
        try:
            tables[side] = recon.read_table(content, name)
        except ValueError as e:
            raise HTTPException(400, f"{label} ({name}): {e}")
    created = now()
    job = Job(name=f"{'Demo · ' if is_demo else ''}{Path(sap_name).stem} vs {CMP_LABELS[comparison_type]}",
              comparison_type=comparison_type, is_demo=is_demo,
              sap=file_meta(sap_name, tables["sap"]), comparison=file_meta(cmp_name, tables["comparison"]),
              created_at=created, expires_at=created + timedelta(days=RETENTION_DAYS),
              events=[event("uploaded", f"{sap_name} + {cmp_name}")])
    await db.jobs.insert_one(job.to_mongo())
    await db.job_files.insert_many([
        {"job_id": job.id, "side": side, "columns": t["columns"], "rows": t["rows"], "row_nums": t["row_nums"],
         "expires_at": job.expires_at} for side, t in tables.items()])
    return job


@api.get("/")
async def root():
    return {"message": "SAP Export Reconciliation API"}


@api.get("/schema")
async def schema():
    return {"fields": [{k: f[k] for k in ("key", "label", "required", "aliases")} for f in recon.CANONICAL],
            "date_formats": recon.DATE_MODES, "pilot_layouts": pilot_layouts.LAYOUTS, "retention_days": RETENTION_DAYS, "disclaimer": recon.DISCLAIMER}


@api.get("/demo/files/{kind}")
async def demo_download(kind: str):
    out = demo_data.demo_file(kind) or pilot_layouts.build_layout(kind)
    if not out:
        raise HTTPException(404, "Unknown demo file")
    content, filename, mime = out
    return StreamingResponse(io.BytesIO(content), media_type=mime,
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@api.post("/jobs", response_model=Job)
async def upload_job(sap_file: UploadFile = File(...), comparison_file: UploadFile = File(...),
                     comparison_type: str = Form("gstr2b")):
    return await create_job(await sap_file.read(), sap_file.filename, await comparison_file.read(),
                            comparison_file.filename, comparison_type, False)


@api.post("/jobs/demo", response_model=Job)
async def demo_job():
    sap, sap_name, _ = demo_data.demo_file("sap_csv")
    gst, gst_name, _ = demo_data.demo_file("gstr2b_xlsx")
    return await create_job(sap, sap_name, gst, gst_name, "gstr2b", True)


@api.get("/jobs")
async def list_jobs():
    docs = await db.jobs.find({}, {"name": 1, "status": 1, "comparison_type": 1, "is_demo": 1, "summary": 1,
                                   "created_at": 1, "expires_at": 1}).sort("created_at", -1).to_list(50)
    return [{**{k: v for k, v in d.items() if k != "_id"}, "id": d["_id"]} for d in docs]


@api.get("/jobs/{job_id}", response_model=Job)
async def read_job(job_id: str):
    return await get_job(job_id)


@api.post("/jobs/{job_id}/reconcile", response_model=Job)
async def run_reconcile(job_id: str, req: ReconcileRequest):
    job = await get_job(job_id)
    label = CMP_LABELS[job.comparison_type]
    errors = recon.validate_mapping(req.sap_mapping, job.sap.columns, "SAP export") + \
        recon.validate_mapping(req.cmp_mapping, job.comparison.columns, label)
    if errors:
        raise HTTPException(400, "; ".join(errors))
    files = {d["side"]: d async for d in db.job_files.find({"job_id": job_id})}
    if len(files) != 2:
        raise HTTPException(410, "Uploaded file data has expired; please upload again")
    started = now()
    results, summary, assumptions = recon.reconcile(files["sap"], files["comparison"], req.sap_mapping,
                                                    req.cmp_mapping, req.tolerance, req.sap_date_format,
                                                    req.cmp_date_format, label, req.absolute_amounts)
    summary["processing_ms"] = int((now() - started).total_seconds() * 1000)
    await db.job_results.delete_many({"job_id": job_id})
    if results:
        await db.job_results.insert_many([{**r, "job_id": job_id, "expires_at": job.expires_at} for r in results])
    settings = {"tolerance": req.tolerance, "sap_date_format": req.sap_date_format,
                "cmp_date_format": req.cmp_date_format, "absolute_amounts": req.absolute_amounts}
    await db.jobs.update_one({"_id": job_id}, {
        "$set": {"status": "reconciled", "mapping": {"sap": req.sap_mapping, "comparison": req.cmp_mapping},
                 "settings": settings, "summary": summary, "assumptions": assumptions},
        "$push": {"events": event("reconciled", f"{summary['matched']} matched, {summary['requires_review']} for review")}})
    return await get_job(job_id)


@api.get("/jobs/{job_id}/results")
async def job_results(job_id: str):
    await get_job(job_id)
    return await db.job_results.find({"job_id": job_id}, {"_id": 0, "job_id": 0, "expires_at": 0}) \
        .sort("seq", 1).to_list(recon.MAX_ROWS * 2)


@api.patch("/jobs/{job_id}/results/{result_id}")
async def review_result(job_id: str, result_id: str, body: ReviewUpdate):
    res = await db.job_results.find_one_and_update(
        {"job_id": job_id, "id": result_id}, {"$set": body.model_dump()},
        projection={"_id": 0, "job_id": 0, "expires_at": 0}, return_document=True)
    if not res:
        raise HTTPException(404, "Result not found")
    await db.jobs.update_one({"_id": job_id}, {"$push": {"events": event(
        "reviewed" if body.reviewed else "reopened", f"row #{res['seq']}")}})
    return res


@api.get("/jobs/{job_id}/report")
async def report(job_id: str, kind: str = Query("exceptions", pattern="^(full|exceptions)$")):
    job = await get_job(job_id)
    if job.status != "reconciled":
        raise HTTPException(400, "Run reconciliation before exporting")
    results = await db.job_results.find({"job_id": job_id}, {"_id": 0}).sort("seq", 1).to_list(recon.MAX_ROWS * 2)
    content = recon.build_report(job.model_dump(), results, kind == "exceptions")
    await db.jobs.update_one({"_id": job_id}, {"$push": {"events": event("exported", kind)}})
    stamp = now().strftime("%Y%m%d_%H%M")
    fname = f"SAP_Recon_{'Exceptions' if kind == 'exceptions' else 'Full'}_{stamp}.xlsx"
    return StreamingResponse(io.BytesIO(content), media_type=demo_data.XLSX,
                             headers={"Content-Disposition": f'attachment; filename="{fname}"'})


@api.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    await get_job(job_id)
    for coll in (db.job_files, db.job_results):
        await coll.delete_many({"job_id": job_id})
    await db.jobs.delete_one({"_id": job_id})
    return {"deleted": True}


@api.get("/templates")
async def list_templates(side: Optional[str] = None):
    q = {"side": side} if side else {}
    docs = await db.mapping_templates.find(q).sort("created_at", -1).to_list(200)
    return [MappingTemplate.from_mongo(d) for d in docs]


@api.post("/templates", response_model=MappingTemplate)
async def save_template(body: TemplateCreate):
    t = MappingTemplate(name=body.name.strip(), side=body.side, mapping=body.mapping, created_at=now())
    await db.mapping_templates.insert_one(t.to_mongo())
    return t


@api.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    r = await db.mapping_templates.delete_one({"_id": template_id})
    if not r.deleted_count:
        raise HTTPException(404, "Template not found")
    return {"deleted": True}


app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True,
                   allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
async def indexes():
    for coll in (db.jobs, db.job_files, db.job_results):
        await coll.create_index("expires_at", expireAfterSeconds=0)
    await db.job_results.create_index([("job_id", 1), ("seq", 1)])
    await db.job_files.create_index("job_id")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
