"""
Promotional banner-related Pydantic models.

Note: This project uses Supabase directly, not SQLAlchemy ORM.
These are Pydantic models for request/response validation only.
The actual database tables are created via SQL migrations.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
