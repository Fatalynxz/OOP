from decimal import Decimal

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="AddOn",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("code", models.CharField(max_length=40, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("price", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=10)),
                ("active", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="AppSetting",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("key", models.CharField(max_length=80, unique=True)),
                ("value", models.JSONField(default=dict)),
            ],
        ),
        migrations.CreateModel(
            name="InventoryItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("sku", models.CharField(max_length=40, unique=True)),
                ("name", models.CharField(max_length=140)),
                ("category", models.CharField(max_length=80)),
                ("unit", models.CharField(max_length=20)),
                ("stock", models.IntegerField(default=0)),
                ("reorder", models.IntegerField(default=0)),
                ("cost", models.DecimalField(decimal_places=2, max_digits=10)),
                ("supplier", models.CharField(blank=True, max_length=120)),
            ],
            options={"ordering": ["sku"]},
        ),
        migrations.CreateModel(
            name="MenuCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("slug", models.SlugField(unique=True)),
                ("name", models.CharField(max_length=80)),
                ("sort_order", models.PositiveIntegerField(default=0)),
            ],
            options={"ordering": ["sort_order", "name"]},
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("order_no", models.CharField(max_length=24, unique=True)),
                ("table", models.CharField(max_length=24)),
                ("order_type", models.CharField(choices=[("Dine in", "Dine in"), ("Take away", "Take away"), ("Delivery", "Delivery")], max_length=20)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("accepted", "Accepted"), ("preparing", "Preparing"), ("serving", "Serving"), ("completed", "Completed"), ("voided", "Voided"), ("refunded", "Refunded")], default="pending", max_length=20)),
                ("priority", models.CharField(default="normal", max_length=10)),
                ("cashier", models.CharField(blank=True, max_length=120)),
                ("payment_method", models.CharField(choices=[("Cash", "Cash"), ("Card", "Card"), ("GCash", "GCash"), ("Maya", "Maya")], default="Cash", max_length=20)),
                ("total", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=10)),
                ("void_reason", models.TextField(blank=True)),
                ("refund_reason", models.TextField(blank=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="StaffUser",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=120)),
                ("username", models.CharField(max_length=80, unique=True)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=40)),
                ("role", models.CharField(choices=[("admin", "Admin"), ("manager", "Manager"), ("cashier", "Cashier"), ("kitchen", "Kitchen")], max_length=20)),
                ("status", models.CharField(choices=[("active", "Active"), ("off", "Off-shift"), ("suspended", "Suspended")], default="active", max_length=20)),
                ("shift", models.CharField(default="Morning", max_length=40)),
                ("password", models.CharField(default="grabeat123", max_length=128)),
                ("last_login_label", models.CharField(default="Never", max_length=40)),
            ],
        ),
        migrations.CreateModel(
            name="MenuItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("code", models.CharField(max_length=40, unique=True)),
                ("name", models.CharField(max_length=140)),
                ("description", models.TextField(blank=True)),
                ("price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("image_url", models.URLField(blank=True)),
                ("stock", models.IntegerField(default=0)),
                ("active", models.BooleanField(default=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="items", to="restaurant.menucategory")),
            ],
            options={"ordering": ["category__sort_order", "name"]},
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=140)),
                ("quantity", models.PositiveIntegerField(default=1)),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("note", models.TextField(blank=True)),
                ("menu_item", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="restaurant.menuitem")),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="restaurant.order")),
            ],
        ),
        migrations.CreateModel(
            name="OrderItemAddOn",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=100)),
                ("price", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=10)),
                ("item", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="add_ons", to="restaurant.orderitem")),
            ],
        ),
    ]
