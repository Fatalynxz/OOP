import json

from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from .models import AddOn
from .repositories import InventoryRepository, MenuRepository, OrderRepository, StaffRepository
from .serializers import InventorySerializer, MenuSerializer, OrderSerializer, StaffSerializer
from .services import AuthService, InventoryService, OrderService, ReportService, StaffService


@method_decorator(csrf_exempt, name="dispatch")
class JsonView(View):
    def payload(self):
        if not self.request.body:
            return {}
        return json.loads(self.request.body.decode("utf-8"))

    def ok(self, data=None, status=200):
        return JsonResponse(data or {}, status=status, safe=isinstance(data, dict))

    def error(self, message, status=400):
        return JsonResponse({"error": message}, status=status)


class AuthLoginView(JsonView):
    def post(self, request):
        self.request = request
        payload = self.payload()
        staff = AuthService().login(payload.get("username", ""), payload.get("password", ""), payload.get("role"))
        if not staff:
            return self.error("Invalid username, password, role, or inactive account.", 401)
        return self.ok({"user": StaffSerializer.one(staff)})


class MenuView(JsonView):
    def get(self, request):
        repo = MenuRepository()
        return self.ok(
            {
                "categories": [MenuSerializer.category(c) for c in repo.categories()],
                "items": [MenuSerializer.item(i) for i in repo.items()],
                "addOns": [MenuSerializer.addon(a) for a in AddOn.objects.filter(active=True).order_by("name")],
            }
        )


class OrderListView(JsonView):
    def get(self, request):
        orders = [OrderSerializer.one(o) for o in OrderRepository().all()]
        return self.ok({"orders": orders})

    def post(self, request):
        self.request = request
        order = OrderService().create(self.payload())
        return self.ok({"order": OrderSerializer.one(order)}, status=201)


class OrderActionView(JsonView):
    actions = {
        "advance": lambda service, order_no, payload: service.advance(order_no),
        "void": lambda service, order_no, payload: service.void(order_no, payload.get("reason", "")),
        "refund": lambda service, order_no, payload: service.refund(order_no, payload.get("reason", "")),
    }

    def post(self, request, order_no, action):
        self.request = request
        if action not in self.actions:
            return self.error("Unknown order action.", 404)
        order = self.actions[action](OrderService(), order_no, self.payload())
        return self.ok({"order": OrderSerializer.one(order)})


class OrderResetView(JsonView):
    def post(self, request):
        OrderService().reset()
        return self.ok({"ok": True})


class KitchenLoadView(JsonView):
    def get(self, request):
        orders = OrderRepository().all()
        active = [o for o in orders if o.status in ["pending", "accepted", "preparing"]]
        item_count = sum(sum(item.quantity for item in order.items.all()) for order in active)
        queue_mins = (item_count * 3 + 1) // 2
        level = "slammed" if queue_mins >= 25 else "busy" if queue_mins >= 12 else "light"
        return self.ok({"activeCount": len(active), "queueMins": queue_mins, "level": level})


class InventoryListView(JsonView):
    def get(self, request):
        return self.ok({"items": [InventorySerializer.one(i) for i in InventoryRepository().all()]})

    def post(self, request):
        self.request = request
        item = InventoryService().create(self.payload())
        return self.ok({"item": InventorySerializer.one(item)}, status=201)


class InventoryAdjustView(JsonView):
    def post(self, request, pk):
        self.request = request
        item = InventoryService().adjust(pk, self.payload().get("delta", 0))
        return self.ok({"item": InventorySerializer.one(item)})


class StaffListView(JsonView):
    def get(self, request):
        return self.ok({"staff": [StaffSerializer.one(s) for s in StaffRepository().all()]})

    def post(self, request):
        self.request = request
        staff = StaffService().create(self.payload())
        return self.ok({"staff": StaffSerializer.one(staff)}, status=201)


class StaffCycleStatusView(JsonView):
    def post(self, request, pk):
        from .models import StaffUser

        staff = StaffUser.objects.get(pk=pk).cycle_status()
        return self.ok({"staff": StaffSerializer.one(staff)})


class StaffStatusView(JsonView):
    def post(self, request, pk):
        self.request = request
        try:
            staff = StaffService().set_status(pk, self.payload().get("status"))
        except ValueError as exc:
            return self.error(str(exc), 400)
        return self.ok({"staff": StaffSerializer.one(staff)})


class ReportTodayView(JsonView):
    def get(self, request):
        return self.ok(ReportService().today())
