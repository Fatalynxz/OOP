from django.urls import path

from .views import (
    AuditLogListView,
    AuthLoginView,
    InventoryAdjustView,
    InventoryListView,
    KitchenLoadView,
    MenuView,
    OrderActionView,
    OrderListView,
    OrderResetView,
    ReportTodayView,
    StaffCycleStatusView,
    StaffListView,
    StaffStatusView,
)


urlpatterns = [
    path("auth/login/", AuthLoginView.as_view()),
    path("menu/", MenuView.as_view()),
    path("orders/", OrderListView.as_view()),
    path("orders/reset/", OrderResetView.as_view()),
    path("orders/<str:order_no>/<str:action>/", OrderActionView.as_view()),
    path("kitchen/load/", KitchenLoadView.as_view()),
    path("inventory/", InventoryListView.as_view()),
    path("inventory/<int:pk>/adjust/", InventoryAdjustView.as_view()),
    path("staff/", StaffListView.as_view()),
    path("staff/<int:pk>/cycle-status/", StaffCycleStatusView.as_view()),
    path("staff/<int:pk>/status/", StaffStatusView.as_view()),
    path("audit-logs/", AuditLogListView.as_view()),
    path("reports/today/", ReportTodayView.as_view()),
]
