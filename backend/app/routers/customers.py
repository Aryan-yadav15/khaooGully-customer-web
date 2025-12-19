"""
Customer profile and address management API routes.
"""

from fastapi import APIRouter, Depends, status
from typing import List, Optional
from supabase import Client
from app.dependencies import GetSupabase, GetCurrentUserId, GetCurrentUser
from app.models.customer import (
    CustomerResponse,
    CustomerUpdate,
    CustomerProfileSummaryResponse,
    CustomerAddressCreate,
    CustomerAddressUpdate,
    CustomerAddressResponse
)
from app.utils.exceptions import NotFoundException, BadRequestException
from app.utils.auth import ValidateEmailDomain


Router = APIRouter(prefix="/profile", tags=["Customer Profile"])


def _has_valid_phone(value: Optional[str]) -> bool:
    if not value:
        return False
    digits = "".join(ch for ch in value if ch.isdigit())
    return len(digits) >= 10


@Router.get("/", response_model=CustomerProfileSummaryResponse)
async def GetCustomerProfile(
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves customer profile summary.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        CustomerProfileSummaryResponse: Customer profile summary
        
    Raises:
        NotFoundException: If profile not found
    """
    Response = Db.table("customer_profile_summary").select("*").eq("id", UserId).execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Profile not found")
    
    Profile = Response.data[0]
    
    return CustomerProfileSummaryResponse(**Profile)


@Router.put("/", response_model=CustomerResponse)
async def UpdateCustomerProfile(
    ProfileUpdate: CustomerUpdate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Updates customer profile information.
    
    Args:
        ProfileUpdate: Profile update data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        CustomerResponse: Updated customer profile
    """
    UpdateData = {}
    
    if ProfileUpdate.fullName is not None:
        if not ProfileUpdate.fullName.strip():
            raise BadRequestException(Detail="Full name cannot be empty")
        UpdateData["full_name"] = ProfileUpdate.fullName
    if ProfileUpdate.phone is not None:
        if not _has_valid_phone(ProfileUpdate.phone):
            raise BadRequestException(Detail="Please enter a valid phone number")
        UpdateData["phone"] = ProfileUpdate.phone
    if ProfileUpdate.email is not None:
        if not ProfileUpdate.email.strip():
            raise BadRequestException(Detail="Email cannot be empty")
        ValidateEmailDomain(ProfileUpdate.email)
        UpdateData["email"] = ProfileUpdate.email
    if ProfileUpdate.defaultCampusId is not None:
        UpdateData["default_campus_id"] = ProfileUpdate.defaultCampusId
    if ProfileUpdate.hostelBlock is not None:
        UpdateData["hostel_block"] = ProfileUpdate.hostelBlock
    if ProfileUpdate.roomNumber is not None:
        UpdateData["room_number"] = ProfileUpdate.roomNumber
    if ProfileUpdate.deliveryInstructions is not None:
        UpdateData["delivery_instructions"] = ProfileUpdate.deliveryInstructions
    if ProfileUpdate.avatarUrl is not None:
        UpdateData["avatar_url"] = ProfileUpdate.avatarUrl
    
    if not UpdateData:
        # Nothing to update, return current profile
        Response = Db.table("customers").select("*").eq("id", UserId).execute()
        Customer = Response.data[0]
    else:
        Updated = Db.table("customers").update(UpdateData).eq("id", UserId).execute()
        Customer = Updated.data[0]
    
    return CustomerResponse(**Customer)


@Router.get("/addresses", response_model=List[CustomerAddressResponse])
async def GetCustomerAddresses(
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves all saved addresses for customer.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        List[CustomerAddressResponse]: List of customer addresses
    """
    Response = Db.table("customer_addresses").select("*").eq("customer_id", UserId).order("is_default", desc=True).execute()
    
    return [CustomerAddressResponse(**Item) for Item in Response.data]


@Router.post("/addresses", response_model=CustomerAddressResponse, status_code=status.HTTP_201_CREATED)
async def CreateAddress(
    AddressData: CustomerAddressCreate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Creates a new address for customer.
    
    Args:
        AddressData: Address creation data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        CustomerAddressResponse: Created address
    """
    # If this is set as default, unset other defaults
    if AddressData.isDefault:
        Db.table("customer_addresses").update({"is_default": False}).eq("customer_id", UserId).execute()
    
    InsertData = {
        "customer_id": UserId,
        "campus_id": AddressData.campusId,
        "label": AddressData.label,
        "hostel_block": AddressData.hostelBlock,
        "room_number": AddressData.roomNumber,
        "floor": AddressData.floor,
        "landmark": AddressData.landmark,
        "phone": AddressData.phone,
        "delivery_instructions": AddressData.deliveryInstructions,
        "is_default": AddressData.isDefault
    }
    
    Response = Db.table("customer_addresses").insert(InsertData).execute()
    Address = Response.data[0]
    
    return CustomerAddressResponse(**Address)


@Router.put("/addresses/{AddressId}", response_model=CustomerAddressResponse)
async def UpdateAddress(
    AddressId: str,
    AddressUpdate: CustomerAddressUpdate,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Updates an existing address.
    
    Args:
        AddressId: Address UUID
        AddressUpdate: Address update data
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        CustomerAddressResponse: Updated address
        
    Raises:
        NotFoundException: If address not found or doesn't belong to user
    """
    # Verify address belongs to user
    CheckResponse = Db.table("customer_addresses").select("*").eq("id", AddressId).eq("customer_id", UserId).execute()
    
    if not CheckResponse.data:
        raise NotFoundException(Detail="Address not found")
    
    UpdateData = {}
    
    if AddressUpdate.label is not None:
        UpdateData["label"] = AddressUpdate.label
    if AddressUpdate.hostelBlock is not None:
        UpdateData["hostel_block"] = AddressUpdate.hostelBlock
    if AddressUpdate.roomNumber is not None:
        UpdateData["room_number"] = AddressUpdate.roomNumber
    if AddressUpdate.floor is not None:
        UpdateData["floor"] = AddressUpdate.floor
    if AddressUpdate.landmark is not None:
        UpdateData["landmark"] = AddressUpdate.landmark
    if AddressUpdate.phone is not None:
        UpdateData["phone"] = AddressUpdate.phone
    if AddressUpdate.deliveryInstructions is not None:
        UpdateData["delivery_instructions"] = AddressUpdate.deliveryInstructions
    if AddressUpdate.isDefault is not None:
        UpdateData["is_default"] = AddressUpdate.isDefault
        # If setting as default, unset others
        if AddressUpdate.isDefault:
            Db.table("customer_addresses").update({"is_default": False}).eq("customer_id", UserId).execute()
    
    if not UpdateData:
        Address = CheckResponse.data[0]
    else:
        Updated = Db.table("customer_addresses").update(UpdateData).eq("id", AddressId).execute()
        Address = Updated.data[0]
    
    return CustomerAddressResponse(**Address)


@Router.delete("/addresses/{AddressId}", status_code=status.HTTP_204_NO_CONTENT)
async def DeleteAddress(
    AddressId: str,
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Deletes an address.
    
    Args:
        AddressId: Address UUID
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Raises:
        NotFoundException: If address not found or doesn't belong to user
    """
    # Verify address belongs to user
    CheckResponse = Db.table("customer_addresses").select("*").eq("id", AddressId).eq("customer_id", UserId).execute()
    
    if not CheckResponse.data:
        raise NotFoundException(Detail="Address not found")
    
    Db.table("customer_addresses").delete().eq("id", AddressId).execute()
