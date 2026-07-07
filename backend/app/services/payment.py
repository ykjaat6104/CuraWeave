import razorpay
from fastapi import HTTPException
from app.config import settings


class PaymentGatewayService:
    def __init__(self):
        self.client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

    def create_order(self, amount_inr: int, receipt_id: str, notes: dict | None = None) -> dict:
        try:
            order_data = {
                "amount": int(amount_inr * 100),
                "currency": "INR",
                "receipt": receipt_id,
                "notes": notes or {},
            }
            order = self.client.order.create(data=order_data)
            return {
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
            }
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Payment gateway error: {str(e)}",
            )

    def verify_payment(self, payment_id: str, order_id: str, signature: str) -> bool:
        try:
            params_dict = {
                "razorpay_payment_id": payment_id,
                "razorpay_order_id": order_id,
                "razorpay_signature": signature,
            }
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except razorpay.errors.SignatureVerificationError:
            return False

    def verify_webhook(self, body: bytes, signature_header: str) -> bool:
        try:
            body_str = body.decode("utf-8")
            self.client.utility.verify_webhook_signature(
                body_str, signature_header, settings.RAZORPAY_WEBHOOK_SECRET
            )
            return True
        except razorpay.errors.SignatureVerificationError:
            return False


payment_gateway = PaymentGatewayService()
