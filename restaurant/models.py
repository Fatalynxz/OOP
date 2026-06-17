from decimal import Decimal

from django.db import models
from django.utils import timezone


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class StaffUser(TimestampedModel):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("manager", "Manager"),
        ("cashier", "Cashier"),
        ("kitchen", "Kitchen"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("off", "Off-shift"),
        ("suspended", "Suspended"),
    ]

    name = models.CharField(max_length=120)
    username = models.CharField(max_length=80, unique=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    shift = models.CharField(max_length=40, default="Morning")
    password = models.CharField(max_length=128, default="grabeat123")
    last_login_label = models.CharField(max_length=40, default="Never")

    def cycle_status(self):
        order = ["active", "off", "suspended"]
        self.status = order[(order.index(self.status) + 1) % len(order)]
        self.save(update_fields=["status", "updated_at"])
        return self

    def __str__(self):
        return f"{self.name} ({self.role})"


class MenuCategory(TimestampedModel):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=80)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class MenuItem(TimestampedModel):
    category = models.ForeignKey(MenuCategory, related_name="items", on_delete=models.PROTECT)
    code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=140)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(blank=True)
    stock = models.IntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category__sort_order", "name"]

    def __str__(self):
        return self.name


class AddOn(TimestampedModel):
    code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Order(TimestampedModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("preparing", "Preparing"),
        ("serving", "Serving"),
        ("completed", "Completed"),
        ("voided", "Voided"),
        ("refunded", "Refunded"),
    ]
    TYPE_CHOICES = [
        ("Dine in", "Dine in"),
        ("Take", "Take"),
    ]
    PAYMENT_CHOICES = [
        ("Cash", "Cash"),
        ("Card", "Card"),
        ("GCash", "GCash"),
        ("Maya", "Maya"),
    ]

    order_no = models.CharField(max_length=24, unique=True)
    table = models.CharField(max_length=24)
    order_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    priority = models.CharField(max_length=10, default="normal")
    cashier = models.CharField(max_length=120, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default="Cash")
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    void_reason = models.TextField(blank=True)
    refund_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def placed_at_label(self):
        return timezone.localtime(self.created_at).strftime("%H:%M")

    def __str__(self):
        return self.order_no


class OrderItem(TimestampedModel):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=140)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)

    def line_total(self):
        return self.quantity * self.unit_price


class OrderItemAddOn(TimestampedModel):
    item = models.ForeignKey(OrderItem, related_name="add_ons", on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))


class InventoryItem(TimestampedModel):
    sku = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=140)
    category = models.CharField(max_length=80)
    unit = models.CharField(max_length=20)
    stock = models.IntegerField(default=0)
    reorder = models.IntegerField(default=0)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    supplier = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["sku"]

    def adjust(self, delta):
        self.stock = max(0, self.stock + delta)
        self.save(update_fields=["stock", "updated_at"])
        return self


class AppSetting(TimestampedModel):
    key = models.CharField(max_length=80, unique=True)
    value = models.JSONField(default=dict)

    def __str__(self):
        return self.key
