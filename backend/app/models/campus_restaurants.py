"""Models for campus-level restaurant listings.

These models support the customer UX where users select a campus first,
then browse all restaurants that can deliver to that campus, along with the
pool mapping each restaurant belongs to.
"""

from pydantic import BaseModel, Field
from typing import Optional

from app.models.restaurant import RestaurantResponse


class CampusRestaurantPoolMapping(BaseModel):
    """Restaurant + its pool mapping for a given campus."""

    campusId: str = Field(validation_alias="campus_id")
    poolId: str = Field(validation_alias="pool_id")
    poolName: str = Field(validation_alias="pool_name")
    poolStatus: Optional[str] = Field(default=None, validation_alias="pool_status")
    restaurant: RestaurantResponse

    class Config:
        populate_by_name = True
