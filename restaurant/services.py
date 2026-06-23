from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Count, Sum
from django.utils import timezone

from .bom_seed import ADD_ON_RECIPES
from .models import AuditLog, InventoryItem, MenuItem, Order, OrderItem, OrderItemAddOn, StaffUser
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
            menu_item = self._find_menu_item(item_payload.get("name", ""))
            item = OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
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
                self._deduct_add_on(item, add_on.get("name", "Add-on"))
            if menu_item:
                self._deduct_recipe(item, menu_item)
            elif item.name in ADD_ON_RECIPES:
                self._deduct_add_on(item, item.name, quantity_multiplier=item.quantity)
        order = self.repo.get_by_no(order.order_no)
        actor = payload.get("actorName") or order.cashier or "Cashier"
        AuditService.record(
            actor_name=actor,
            actor_role=payload.get("actorRole") or "cashier",
            action="order.created",
            summary=f"{actor} created {order.order_no}",
            object_type="order",
            object_id=order.order_no,
            metadata={"total": float(order.total), "items": len(payload.get("items", []))},
        )
        return order

    def _find_menu_item(self, name):
        clean_name = (name or "").strip()
        if not clean_name:
            return None
        exact = MenuItem.objects.filter(name__iexact=clean_name).first()
        if exact:
            return exact
        drink_match = MenuItem.objects.filter(name__iexact=f"{clean_name} 16oz").first()
        if drink_match:
            return drink_match
        return MenuItem.objects.filter(name__icontains=clean_name).first()

    def _deduct_recipe(self, order_item, menu_item):
        deductions = []
        for line in menu_item.recipe_lines.select_related("inventory_item").all():
            amount = line.quantity * order_item.quantity
            ingredient = line.inventory_item
            before = ingredient.stock
            ingredient.adjust(-amount)
            deductions.append(
                {
                    "ingredient": ingredient.name,
                    "used": amount,
                    "unit": ingredient.unit,
                    "before": before,
                    "after": ingredient.stock,
                }
            )
        if deductions:
            AuditService.record(
                actor_name=order_item.order.cashier or "Cashier",
                actor_role="cashier",
                action="inventory.deducted",
                summary=f"Inventory deducted for {order_item.order.order_no} - {order_item.name}",
                object_type="order",
                object_id=order_item.order.order_no,
                metadata={"item": order_item.name, "quantity": order_item.quantity, "deductions": deductions},
            )

    def _deduct_add_on(self, order_item, add_on_name, quantity_multiplier=None):
        recipe = ADD_ON_RECIPES.get(add_on_name)
        if not recipe:
            return
        multiplier = quantity_multiplier if quantity_multiplier is not None else order_item.quantity
        deductions = self._deduct_inventory_lines(recipe, multiplier)
        if deductions:
            AuditService.record(
                actor_name=order_item.order.cashier or "Cashier",
                actor_role="cashier",
                action="inventory.deducted",
                summary=f"Inventory deducted for {order_item.order.order_no} - {add_on_name}",
                object_type="order",
                object_id=order_item.order.order_no,
                metadata={"item": order_item.name, "addOn": add_on_name, "quantity": multiplier, "deductions": deductions},
            )

    def _deduct_inventory_lines(self, recipe, multiplier=1):
        deductions = []
        for ingredient_name, quantity in recipe.items():
            ingredient = InventoryItem.objects.filter(name=ingredient_name).first()
            if not ingredient:
                continue
            amount = quantity * multiplier
            before = ingredient.stock
            ingredient.adjust(-amount)
            deductions.append(
                {
                    "ingredient": ingredient.name,
                    "used": amount,
                    "unit": ingredient.unit,
                    "before": before,
                    "after": ingredient.stock,
                }
            )
        return deductions

    def advance(self, order_no, actor_name="Kitchen Staff", actor_role="kitchen"):
        order = self.repo.get_by_no(order_no)
        previous_status = order.status
        if order.status in self.ACTIVE_FLOW:
            idx = self.ACTIVE_FLOW.index(order.status)
            order.status = self.ACTIVE_FLOW[min(idx + 1, len(self.ACTIVE_FLOW) - 1)]
            order.save(update_fields=["status", "updated_at"])
            AuditService.record(
                actor_name=actor_name or "Kitchen Staff",
                actor_role=actor_role or "kitchen",
                action="order.status_changed",
                summary=f"{actor_name or 'Kitchen Staff'} moved {order.order_no} to {order.status.title()}",
                object_type="order",
                object_id=order.order_no,
                metadata={"from": previous_status, "to": order.status},
            )
        return self.repo.get_by_no(order_no)

    def void(self, order_no, reason, actor_name="Staff", actor_role="cashier"):
        order = self.repo.get_by_no(order_no)
        order.status = "voided"
        order.void_reason = reason or "No reason given"
        order.save(update_fields=["status", "void_reason", "updated_at"])
        AuditService.record(
            actor_name=actor_name or "Staff",
            actor_role=actor_role or "cashier",
            action="order.voided",
            summary=f"{actor_name or 'Staff'} voided {order.order_no}",
            object_type="order",
            object_id=order.order_no,
            metadata={"reason": order.void_reason},
        )
        return self.repo.get_by_no(order_no)

    def refund(self, order_no, reason, actor_name="Staff", actor_role="cashier"):
        order = self.repo.get_by_no(order_no)
        order.status = "refunded"
        order.refund_reason = reason or "No reason given"
        order.save(update_fields=["status", "refund_reason", "updated_at"])
        AuditService.record(
            actor_name=actor_name or "Staff",
            actor_role=actor_role or "cashier",
            action="order.refunded",
            summary=f"{actor_name or 'Staff'} refunded {order.order_no}",
            object_type="order",
            object_id=order.order_no,
            metadata={"reason": order.refund_reason},
        )
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
    def create(self, payload, actor_name="Admin", actor_role="admin"):
        name = payload["name"].strip()
        email = (payload.get("email") or "").strip()
        if not email:
            raise ValueError("Email is required.")
        try:
            validate_email(email)
        except ValidationError as exc:
            raise ValueError("Enter a valid email address, like juan@grabeat.ph.") from exc
        username = payload.get("username") or name.lower().replace(" ", ".")
        staff = StaffUser.objects.create(
            name=name,
            username=username,
            email=email,
            phone=payload.get("phone", "+63 9XX XXX XXXX"),
            role=payload.get("role", "cashier"),
            shift=payload.get("shift", "Morning"),
            password=payload.get("password", "grabeat123"),
        )
        AuditService.record(
            actor_name=actor_name or "Admin",
            actor_role=actor_role or "admin",
            action="staff.created",
            summary=f"{actor_name or 'Admin'} created staff account for {staff.name}",
            object_type="staff",
            object_id=str(staff.id),
            metadata={"staff": staff.name, "role": staff.role},
        )
        return staff

    def set_status(self, pk, status, actor_name="Admin", actor_role="admin"):
        if status not in ["active", "inactive"]:
            raise ValueError("Status must be active or inactive.")
        staff = StaffUser.objects.get(pk=pk)
        previous_status = "active" if staff.status == "active" else "inactive"
        staff.status = "active" if status == "active" else "off"
        staff.save(update_fields=["status", "updated_at"])
        AuditService.record(
            actor_name=actor_name or "Admin",
            actor_role=actor_role or "admin",
            action="staff.status_changed",
            summary=f"{actor_name or 'Admin'} changed {staff.name}'s status to {status.title()}",
            object_type="staff",
            object_id=str(staff.id),
            metadata={"staff": staff.name, "from": previous_status, "to": status},
        )
        return staff


class AuditService:
    @staticmethod
    def record(actor_name, actor_role, action, summary, object_type="", object_id="", metadata=None):
        return AuditLog.objects.create(
            actor_name=actor_name or "System",
            actor_role=actor_role or "",
            action=action,
            summary=summary,
            object_type=object_type,
            object_id=object_id,
            metadata=metadata or {},
        )

    def recent(self, limit=100):
        return AuditLog.objects.all()[:limit]


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
