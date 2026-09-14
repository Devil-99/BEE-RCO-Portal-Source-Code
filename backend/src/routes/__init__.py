from .entity import router as entity_router
from .login import router as login_router
from .users import router as users_router
from .sector_type import router as sector_type_router
from .state import router as state_router
from .organization_options import router as organization_options_router  
from .pat_registration import router as pat_registration_router
from .financial_year import router as financial_year_router
from .submission_period import router as submission_period_router
from .cppform import router as cppform_router
from .discom import router as discom_quater_router
from .audit import router as audit_router
from .auditFirm import router as audit_firm_router
from .sms import router as sms_router
from .payments import router as payment_router
from .discom import router as discom_router
from .form import router as form_router
from .workflow import router  as workflow_router
from .form_target import router as form_target_router 
from .upload import router as uploads_router
from .corp_child import router as corporate_router
from src.helpdesk.routes.helpdesk_routes import router as helpdesk_router
from .dashboard import router as dashboard_router
from .buyout import router as buyout_router
from .roles import router as roles_router
from .payment_category import router as payment_category_router
from .category import router as category_router

__all__ = [
    "entity_router",
    "login_router",
    "users_router",
    "sector_type_router",
    "state_router",
    "organization_options_router",
    "pat_registration_router",
    "financial_year_router",
    "submission_period_router",
    "cppform_router",
    "discom_quater_router",
    "audit_router",
    "sms_router",
    "audit_firm_router",
    "payment_router",
    "discom_router",
    "form_router",
    "workflow_router",
    "form_target_router",
    "uploads_router",
    "corporate_router",
    "helpdesk_router",
    "dashboard_router",
    "buyout_router",
    "roles_router",
    "payment_category_router",
    "category_router"
]