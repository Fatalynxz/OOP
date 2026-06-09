from django.db.models import Max, Prefetch

from .models import InventoryItem, MenuCategory, MenuItem, Order, OrderItem, StaffUser


class StaffRepository:
    def all(self):
        return StaffUser.objects.order_by("name")

    def find_for_login(self, username, role):
        query = StaffUser.objects.filter(username=username, status="active")
        if role:
            query = query.filter(role=role)
        return query.first()


class MenuRepository:
    def categories(self):
        return MenuCategory.objects.all()

    def items(self):
        return MenuItem.objects.select_related("category").filter(active=True)


class OrderRepository:
    def all(self):
        return Order.objects.prefetch_related(Prefetch("items", queryset=OrderItem.objects.prefetch_related("add_ons"))).all()

    def get_by_no(self, order_no):
        return self.all().get(order_no=order_no)

    def next_number(self):
        latest = Order.objects.aggregate(max_no=Max("order_no"))["max_no"]
        if not latest or "-" not in latest:
            return "ORD-1043"
        try:
            return f"ORD-{int(latest.split('-')[-1]) + 1}"
        except ValueError:
            return "ORD-1043"


class InventoryRepository:
    def all(self):
        return InventoryItem.objects.all()

    def get(self, pk):
        return InventoryItem.objects.get(pk=pk)
