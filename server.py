import asyncio
import base64
from contextlib import asynccontextmanager
import hmac
from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import FileResponse, HTMLResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
from Backend.lib.db import client, db, ensure_indexes


# Startup runs before the yield, shutdown after it. Add your own setup/teardown here.
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())  # background: a big index build must not block boot
    yield
    client.close()


# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)


@app.middleware("http")
async def protect_demo(request: Request, call_next):
    """Optional shared-password gate for a public demo; credentials come from host env."""
    if os.environ.get("APP_ACCESS_REQUIRED", "false").lower() == "true" and request.url.path != "/healthz":
        username = os.environ.get("APP_USERNAME", "")
        password = os.environ.get("APP_PASSWORD", "")
        if not username or not password:
            return Response("Demo access is not configured", status_code=503)
        auth = request.headers.get("authorization", "")
        valid = False
        if auth.startswith("Basic "):
            try:
                supplied_user, supplied_password = base64.b64decode(auth[6:], validate=True).decode("utf-8").split(":", 1)
                valid = hmac.compare_digest(supplied_user, username) and hmac.compare_digest(supplied_password, password)
            except (ValueError, UnicodeDecodeError):
                valid = False
        if not valid:
            return Response(
                "Authentication required", status_code=401,
                headers={"WWW-Authenticate": 'Basic realm="FlowPilot demo", charset="UTF-8"'},
            )
    return await call_next(request)


@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"status": "ok"}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Feature routers (each exposes its own APIRouter; all paths land under /api)
from Backend.routers import activity, assistant, studios, workflows

api_router.include_router(workflows.router)
api_router.include_router(assistant.router)
api_router.include_router(studios.router)
api_router.include_router(activity.router)

# Include the router in the main app
app.include_router(api_router)


@app.get("/{path:path}", include_in_schema=False)
async def serve_frontend(path: str):
    """Serve the Vite build and send browser routes to the SPA entry point."""
    dist_dir = (ROOT_DIR / "dist").resolve()
    index_file = dist_dir / "index.html"
    if not index_file.is_file():
        return HTMLResponse("Frontend build is missing", status_code=404)
    if path == "" or path == "index.html":
        return FileResponse(index_file)
    requested = (dist_dir / path).resolve()
    if requested.is_relative_to(dist_dir) and requested.is_file():
        return FileResponse(requested)
    if path == "api" or path.startswith("api/") or Path(path).suffix:
        return Response(status_code=404)
    return FileResponse(index_file)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
