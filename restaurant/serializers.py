from decimal import Decimal


def money(value):
    return float(value or Decimal("0.00"))


class StaffSerializer:
    @staticmethod
    def one(staff):
        return {
            "id": f"u{staff.id}",
            "dbId": staff.id,
            "name": staff.name,
            "username": staff.username,
            "email": staff.email,
            "phone": staff.phone,
            "role": staff.role,
            "status": staff.status,
            "shift": staff.shift,
            "lastLogin": staff.last_login_label,
            "avatarTint": "from-red-500 to-red-700",
        }


class MenuSerializer:
    @staticmethod
    def category(category):
        return {"id": category.slug, "name": category.name}

    @staticmethod
    def item(item):
        return {
            "id": item.code,
            "name": item.name,
            "desc": item.description,
            "price": money(item.price),
            "category": item.category.slug,
            "image": item.image_url,
            "stock": item.stock,
        }

    @staticmethod
    def addon(addon):
        return {"id": addon.code, "name": addon.name, "price": money(addon.price)}


class OrderSerializer:
    @staticmethod
    def item(item):
        return {
            "name": item.name,
            "qty": item.quantity,
            "price": money(item.unit_price),
            "note": item.note or None,
            "addOns": [{"name": add_on.name, "price": money(add_on.price)} for add_on in item.add_ons.all()],
        }

    @staticmethod
    def one(order):
        return {
            "id": order.order_no,
            "table": order.table,
            "type": order.order_type,
            "placedAt": order.placed_at_label,
            "createdAt": int(order.created_at.timestamp() * 1000),
            "items": [OrderSerializer.item(item) for item in order.items.all()],
            "status": order.status,
            "priority": order.priority,
            "total": money(order.total),
            "cashier": order.cashier or None,
            "paymentMethod": order.payment_method,
            "voidReason": order.void_reason or None,
            "refundReason": order.refund_reason or None,
        }


class InventorySerializer:
    @staticmethod
    def one(item):
        return {
            "id": f"i{item.id}",
            "dbId": item.id,
            "sku": item.sku,
            "name": item.name,
            "category": item.category,
            "unit": item.unit,
            "stock": item.stock,
            "reorder": item.reorder,
            "cost": money(item.cost),
            "supplier": item.supplier,
            "updated": item.updated_at.strftime("%b %d, %H:%M"),
        }
