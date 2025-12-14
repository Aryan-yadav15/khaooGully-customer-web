"""
Business logic service for order pricing calculations.
"""

from app.config import settings


class PricingService:
    """Service for calculating order pricing breakdown."""
    
    @staticmethod
    def CalculateOrderPricing(
        Subtotal: int,
        DeliveryFee: int,
        PromoCode: str = None
    ) -> dict:
        """
        Calculates complete order pricing breakdown.
        
        Args:
            Subtotal: Sum of all item prices
            DeliveryFee: Delivery fee from pool
            PromoCode: Optional promo code (not implemented yet)
            
        Returns:
            dict: Pricing breakdown with all components
        """
        # Discount calculation (would check promo code in real implementation)
        Discount = 0
        if PromoCode:
            # This would be implemented with promo code validation
            # For now, just placeholder
            pass
        
        # Total calculation (no platform fee or taxes)
        Total = Subtotal + DeliveryFee - Discount
        
        return {
            "Subtotal": Subtotal,
            "DeliveryFee": DeliveryFee,
            "PlatformFee": 0,
            "Taxes": 0,
            "Discount": Discount,
            "Total": Total
        }
    
    @staticmethod
    def ValidateCartMinimum(Subtotal: int) -> bool:
        """
        Validates that cart meets minimum value requirement.
        
        Args:
            Subtotal: Cart subtotal in paise
            
        Returns:
            bool: True if meets minimum, False otherwise
        """
        return Subtotal >= settings.MinCartValue
