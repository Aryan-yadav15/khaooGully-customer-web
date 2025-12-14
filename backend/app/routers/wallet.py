"""
Wallet API routes for managing customer wallets and transactions.
"""

from fastapi import APIRouter, Depends, status
from typing import List
from supabase import Client
from app.dependencies import GetSupabase, GetSupabaseAdmin, GetCurrentUserId, RequireAdmin
from app.models.wallet import (
    WalletResponse,
    WalletTransactionResponse,
    WalletTransactionCreate
)
from app.utils.exceptions import (
    NotFoundException,
    BadRequestException
)


Router = APIRouter(prefix="/wallet", tags=["Wallet"])


@Router.get("/", response_model=WalletResponse)
async def GetMyWallet(
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves wallet information for the authenticated customer.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        WalletResponse: Customer wallet information
    """
    Response = Db.table("customer_wallet").select("*").eq("customer_id", UserId).single().execute()
    
    if not Response.data:
        raise NotFoundException(Detail="Wallet not found")
    
    Wallet = Response.data
    
    return WalletResponse(**Wallet)


@Router.get("/transactions", response_model=List[WalletTransactionResponse])
async def GetMyWalletTransactions(
    UserId: str = Depends(GetCurrentUserId),
    Db: Client = Depends(GetSupabase)
):
    """
    Retrieves wallet transaction history for the authenticated customer.
    
    Args:
        UserId: Authenticated user ID
        Db: Supabase client instance
        
    Returns:
        List[WalletTransactionResponse]: List of wallet transactions
    """
    # First get the wallet ID
    WalletResponse = Db.table("customer_wallet").select("id").eq("customer_id", UserId).single().execute()
    
    if not WalletResponse.data:
        raise NotFoundException(Detail="Wallet not found")
    
    WalletId = WalletResponse.data["id"]
    
    # Get transactions
    TransactionsResponse = Db.table("wallet_transactions").select("*").eq("wallet_id", WalletId).order("created_at", desc=True).execute()
    
    return [WalletTransactionResponse(**Item) for Item in TransactionsResponse.data]


# Admin endpoints
@Router.post("/transactions", response_model=WalletTransactionResponse, status_code=status.HTTP_201_CREATED)
async def CreateWalletTransaction(
    TransactionData: WalletTransactionCreate,
    CurrentUser: dict = Depends(RequireAdmin),
    Db: Client = Depends(GetSupabaseAdmin)
):
    """
    Creates a wallet transaction (admin only).
    This is used for manual adjustments, refunds, or rewards.
    
    Args:
        TransactionData: Transaction creation data
        CurrentUser: Authenticated admin user
        Db: Supabase admin client instance
        
    Returns:
        WalletTransactionResponse: Created transaction
    """
    # Get customer's wallet
    WalletResponse = Db.table("customer_wallet").select("*").eq("customer_id", TransactionData.customerId).single().execute()
    
    if not WalletResponse.data:
        raise NotFoundException(Detail="Customer wallet not found")
    
    Wallet = WalletResponse.data
    CurrentBalance = Wallet.get("balance", 0)
    
    # Calculate new balance
    if TransactionData.transactionType == "credit":
        NewBalance = CurrentBalance + TransactionData.amount
        NewTotalEarned = Wallet.get("total_earned", 0) + TransactionData.amount
        
        # Update wallet
        Db.table("customer_wallet").update({
            "balance": NewBalance,
            "total_earned": NewTotalEarned
        }).eq("id", Wallet["id"]).execute()
    else:  # debit
        if CurrentBalance < TransactionData.amount:
            raise BadRequestException(Detail="Insufficient wallet balance")
        
        NewBalance = CurrentBalance - TransactionData.amount
        NewTotalSpent = Wallet.get("total_spent", 0) + TransactionData.amount
        
        # Update wallet
        Db.table("customer_wallet").update({
            "balance": NewBalance,
            "total_spent": NewTotalSpent
        }).eq("id", Wallet["id"]).execute()
    
    # Create transaction record
    TransactionInsert = {
        "wallet_id": Wallet["id"],
        "transaction_type": TransactionData.transactionType,
        "amount": TransactionData.amount,
        "source": TransactionData.source,
        "description": TransactionData.description,
        "order_id": TransactionData.orderId,
        "balance_after": NewBalance
    }
    
    Response = Db.table("wallet_transactions").insert(TransactionInsert).execute()
    Transaction = Response.data[0]
    
    return WalletTransactionResponse(**Transaction)
