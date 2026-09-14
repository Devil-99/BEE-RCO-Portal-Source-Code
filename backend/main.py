import os
import sys
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import TimeoutError as SQLAlchemyTimeoutError
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded 
from slowapi.util import get_remote_address
from src.utils.logger import setup_logging

setup_logging()

# -----------------------------
# 1. IMPORT DB AND INIT IT FIRST
# -----------------------------
import src.database as database
from src.create_table import create_table

database.init_db()
create_table(database.engine)

# -----------------------------
# 2. NOW import routers (safe)
# -----------------------------
from src.routes import (
    entity_router, login_router, users_router, sector_type_router,
    state_router, organization_options_router, pat_registration_router,
    cppform_router, financial_year_router, sms_router, audit_router,
    submission_period_router, discom_quater_router, audit_firm_router,
    workflow_router, payment_router, discom_router, form_router,
    form_target_router , uploads_router, corporate_router, helpdesk_router,
    dashboard_router, buyout_router, roles_router, payment_category_router,
    category_router
)

# -----------------------------
# APP SETUP
# -----------------------------

limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
    start_scheduler()
    
from src.middleware.SessionManager import SessionManagerMiddleware
from cron_job.cronJob import start_scheduler, scheduler
from src.middleware.API_Permission_Checker import PermissionMiddleware

ALLOWED_HOSTS = [
    "127.0.0.1",
    "10.0.2.2",
    "111.118.189.10",
    "49.50.109.30",
    "www.rco.beeindia.gov.in",
    "rco.beeindia.gov.in"
]

app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://www.rco.beeindia.gov.in/"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=[
        "X-Session-Last-Activity",
        "X-Session-Expires-At",
    ],
)

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        # Log error if needed
        print(f"Unhandled error: {e}")
        return JSONResponse(
            status_code=500,
            content={"message": "Something went wrong"},
        )
        
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors()[0]["msg"]
        },
    )

@app.exception_handler(SQLAlchemyTimeoutError)
async def sqlalchemy_timeout_handler(
    request: Request,
    exc: SQLAlchemyTimeoutError
):
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Server is currently experiencing high database load. Please try again shortly."
        }
    )

# PermissionMiddleware is commented out for now, as it may require further configuration or testing.
# app.add_middleware(PermissionMiddleware)

app.add_middleware(SessionManagerMiddleware)

# @app.middleware("http")
# async def host_header_protection(request: Request, call_next):
 
#     host_header = request.headers.get("host")
#     # If no host header present → reject
#     if not host_header:
#         return JSONResponse(
#             status_code=400,
#             content={"message": "Invalid Host header"}
#         )
 
#     # Extract hostname without port (e.g., "example.com:8000" → "example.com")
#     hostname = host_header.split(":")[0].lower()
 
#     # Validate against allowed hosts
#     if hostname not in ALLOWED_HOSTS:
#         return JSONResponse(
#             status_code=400,
#             content={"message": "Invalid or unauthorized Host header"}
#         )
 
#     # If valid, allow request
#     return await call_next(request)

# -----------------------------
# ROUTES
# -----------------------------
app.include_router(entity_router, prefix="/v1")
app.include_router(login_router, prefix="/v1")
app.include_router(users_router, prefix="/v1")
app.include_router(sector_type_router, prefix="/v1")
app.include_router(state_router, prefix="/v1")
app.include_router(organization_options_router, prefix="/v1")
app.include_router(pat_registration_router, prefix="/v1")
app.include_router(financial_year_router, prefix="/v1")
app.include_router(audit_router, prefix="/v1")
app.include_router(form_router, prefix="/v1")
app.include_router(discom_router, prefix="/v1")
app.include_router(workflow_router, prefix="/v1")
app.include_router(form_target_router, prefix="/v1")
app.include_router(discom_quater_router, prefix="/v1")
app.include_router(submission_period_router, prefix="/v1")
app.include_router(cppform_router, prefix="/v1")
app.include_router(audit_firm_router, prefix="/v1")
app.include_router(sms_router, prefix="/v1")
app.include_router(payment_router, prefix="/v1")
app.include_router(uploads_router, prefix="/v1")
app.include_router(corporate_router, prefix="/v1")
app.include_router(dashboard_router, prefix="/v1")
app.include_router(buyout_router, prefix="/v1")
app.include_router(roles_router, prefix="/v1")
app.include_router(payment_category_router, prefix="/v1")
app.include_router(category_router, prefix="/v1")
app.include_router(helpdesk_router, prefix="/v1")

@app.options("/{any}")
async def options_route(any):
    return {}

# @app.get("/v1/uploads/{filename}")
# async def get_file(filename: str):
#     file_path = os.path.join("uploads", filename)
#     if not os.path.exists(file_path):
#         raise HTTPException(status_code=404, detail="File not found")
#     return FileResponse(file_path)


# Run server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        proxy_headers=True,
        port=8000,
        forwarded_allow_ips="127.0.0.1"
    )
