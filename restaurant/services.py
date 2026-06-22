from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Count, Sum
from django.utils import timezone

from .models import InventoryItem, Order, OrderItem, OrderItemAddOn, StaffUser
from .repositories import InventoryRepository, OrderRepository, StaffRepository


class AuthService:
    def __init__(self, staff_repo=None):
        self.staff_repo = staff_repo or StaffRepository()

    def login(self, username, password, role):
        staff = self.staff_repo.find_for_login(username=username, role=role)
        if staff and staff.password == password:
            return staff
        return None


class OrderService:
    ACTIVE_FLOW = ["pending", "accepted", "preparing", "serving", "completed"]

    def __init__(self, repo=None):
        self.repo = repo or OrderRepository()

    @transaction.atomic
    def create(self, payload):
        order_type = payload.get("type") or "Take"
        if order_type != "Dine in":
            order_type = "Take"
        order = Order.objects.create(
            order_no=self.repo.next_number(),
            table=payload.get("table") or "TAKE",
            order_type=order_type,
            priority=payload.get("priority") or "normal",
            cashier=payload.get("cashier") or "",
            payment_method=payload.get("paymentMethod") or "Cash",
            total=Decimal(str(payload.get("total") or 0)),
        )
        for item_payload in payload.get("items", []):
            item = OrderItem.objects.create(
                order=order,
                name=item_payload.get("name", "Item"),
                quantity=int(item_payload.get("qty") or 1),
                unit_price=Decimal(str(item_payload.get("price") or 0)),
                note=item_payload.get("note") or "",
            )
            for add_on in item_payload.get("addOns") or []:
                OrderItemAddOn.objects.create(
                    item=item,
                    name=add_on.get("name", "Add-on"),
                    price=Decimal(str(add_on.get("price") or 0)),
                )
        return self.repo.get_by_no(order.order_no)

    def advance(self, order_no):
        order = self.repo.get_by_no(order_no)
        if order.status in self.ACTIVE_FLOW:
            idx = self.ACTIVE_FLOW.index(order.status)
            order.status = self.ACTIVE_FLOW[min(idx + 1, len(self.ACTIVE_FLOW) - 1)]
            order.save(update_fields=["status", "updated_at"])
        return self.repo.get_by_no(order_no)

    def void(self, order_no, reason):
        order = self.repo.get_by_no(order_no)
        order.status = "voided"
        order.void_reason = reason or "No reason given"
        order.save(update_fields=["status", "void_reason", "updated_at"])
        return self.repo.get_by_no(order_no)

    def refund(self, order_no, reason):
        order = self.repo.get_by_no(order_no)
        order.status = "refunded"
        order.refund_reason = reason or "No reason given"
        order.save(update_fields=["status", "refund_reason", "updated_at"])
        return self.repo.get_by_no(order_no)

    def reset(self):
        Order.objects.all().delete()


class InventoryService:
    def __init__(self, repo=None):
        self.repo = repo or InventoryRepository()

    def adjust(self, pk, delta):
        return self.repo.get(pk).adjust(int(delta))

    def create(self, payload):
        return InventoryItem.objects.create(
            sku=payload["sku"],
            name=payload["name"],
            category=payload.get("category", "General"),
            unit=payload.get("unit", "pc"),
            stock=int(payload.get("stock") or 0),
            reorder=int(payload.get("reorder") or 0),
            cost=Decimal(str(payload.get("cost") or 0)),
            supplier=payload.get("supplier", ""),
        )


class StaffService:
    def create(self, payload):
        name = payload["name"].strip()
        email = (payload.get("email") or "").strip()
        if not email:
            raise ValueError("Email is required.")
        try:
            validate_email(email)
        except ValidationError as exc:
            raise ValueError("Enter a valid email address, like juan@grabeat.ph.") from exc
        username = payload.get("username") or name.lower().replace(" ", ".")
        return StaffUser.objects.create(
            name=name,
            username=username,
            email=email,
            phone=payload.get("phone", "+63 9XX XXX XXXX"),
            role=payload.get("role", "cashier"),
            shift=payload.get("shift", "Morning"),
            password=payload.get("password", "grabeat123"),
        )

    def set_status(self, pk, status):
        if status not in ["active", "inactive"]:
            raise ValueError("Status must be active or inactive.")
        staff = StaffUser.objects.get(pk=pk)
        staff.status = "active" if status == "active" else "off"
        staff.save(update_fields=["status", "updated_at"])
        return staff


class ReportService:
    def today(self):
        start = timezone.localtime().replace(hour=0, minute=0, second=0, microsecond=0)
        orders = Order.objects.filter(created_at__gte=start).exclude(status="voided")
        gross = orders.exclude(status="refunded").aggregate(total=Sum("total"))["total"] or Decimal("0.00")
        count = orders.count()
        by_type = orders.values("order_type").annotate(value=Count("id")).order_by("order_type")
        top_items = OrderItem.objects.filter(order__created_at__gte=start).values("name").annotate(sold=Sum("quantity")).order_by("-sold")[:8]
        channels = {}
        for row in by_type:
            label = "Dine in" if row["order_type"] == "Dine in" else "Take"
            channels[label] = channels.get(label, 0) + row["value"]
        return {
            "date": start.date().isoformat(),
            "grossSales": float(gross),
            "orders": count,
            "avgTicket": float(gross / count) if count else 0,
            "channels": [{"name": name, "value": value} for name, value in channels.items()],
            "topItems": list(top_items),
        }
