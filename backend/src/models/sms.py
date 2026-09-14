from sqlalchemy import Column, Integer, String, Text
from src.models.base import Base


class SMS_Templates(Base):
    __tablename__ = "sms_templates"

    # NOTE: `dlt_template_id` is used as the canonical identifier for SMS templates.
    # Be sure to run the corresponding DB migration to change the PK before deploying.
    dlt_template_id = Column(String, primary_key=True, nullable=False)
    template_key = Column(String, unique=True, nullable=False, index=True)
    content = Column(Text, nullable=False)

    def to_dict(self):
        return {
            "dlt_template_id": self.dlt_template_id,
            "template_key": self.template_key,
            "content": self.content
        }