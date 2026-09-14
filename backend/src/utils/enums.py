import enum

class PaymentStatusEnum(str, enum.Enum):
    INITIATED = "INITIATED"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class PaymentStatusEnumNew(str, enum.Enum):
    INITIATED = "INITIATED"
    SUCCESS = "SUCCESS"
    PENDING = "PENDING"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    
class EntityTypeEnum(str, enum.Enum):
    INDUSTRY = "INDUSTRY"
    DISCOM = "DISCOM"
    NOBE = "NOBE"
    FIRM = "FIRM"

class FormTypeEnum(str, enum.Enum):
    INPUT = "INPUT"
    LOGIC = "LOGIC"
    FETCHED = "FETCHED"

class PeriodCodeEnum(str, enum.Enum):
    Q1 = "Q1"
    Q2 = "Q2"
    Q3 = "Q3"
    Q4 = "Q4"
    ANNUAL = "ANNUAL"

class SubmissionStatusEnum(str, enum.Enum):
    PENDING=0
    APPROVED=1
    REJECTED=2
    IN_PROGRESS=3
    DRAFT=4
    
class StageActionStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SENT_BACK = "SENT_BACK"
    COMMENTED = "COMMENTED"

class PaymentCategoryCodeEnum(str, enum.Enum):
    REGISTRATION = "REGISTRATION"
    BUYOUT = "BUYOUT"

class BuyoutTypeEnum(str, enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    CORPORATE = "CORPORATE"

class BuyoutRequestStatusEnum(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ComplianceStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    COMPLIANT = "COMPLIANT"
    REJECTED = "REJECTED"

class RCOSourceEnum(str, enum.Enum):
    WIND = "WIND"
    HYDRO = "HYDRO"
    DISTRIBUTED = "DISTRIBUTED"
    OTHERS = "OTHERS"