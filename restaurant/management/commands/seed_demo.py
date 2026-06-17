from decimal import Decimal

from django.core.management.base import BaseCommand

from restaurant.models import AddOn, InventoryItem, MenuCategory, MenuItem, StaffUser


class Command(BaseCommand):
    help = "Seed Supabase/Postgres with demo data used by the GrabEat UI."

    def handle(self, *args, **options):
        staff = [
            ("Maria Reyes", "cashier", "maria.reyes", "maria.reyes@grabeat.ph", "cashier"),
            ("Joel Mendoza", "kitchen", "joel.m", "joel.m@grabeat.ph", "kitchen"),
            ("Ana Cruz", "manager", "ana.cruz", "ana.cruz@grabeat.ph", "admin"),
            ("Daniel Lim", "admin", "daniel.lim", "daniel.lim@grabeat.ph", "admin"),
            ("Liza Bautista", "cashier2", "liza.b", "liza.b@grabeat.ph", "cashier"),
        ]
        for name, username, legacy_username, email, role in staff:
            if not StaffUser.objects.filter(username=username).exists():
                StaffUser.objects.filter(username=legacy_username).update(username=username)
            StaffUser.objects.update_or_create(
                username=username,
                defaults={"name": name, "email": email, "role": role, "status": "active", "password": "grabeat123"},
            )

        categories = [
            ("takoyaki", "Takoyaki"),
            ("fried", "Gyoza & Korokke"),
            ("okonomiyaki", "Okonomiyaki"),
            ("noodles", "Yakisoba"),
            ("taiyaki", "Taiyaki"),
            ("tonkatsu", "Tonkatsu"),
            ("addons", "Add-ons"),
        ]
        category_map = {}
        for index, (slug, name) in enumerate(categories):
            category, _ = MenuCategory.objects.update_or_create(slug=slug, defaults={"name": name, "sort_order": index})
            category_map[slug] = category

        image = "https://images.unsplash.com/photo-1574236079563-bf177d2ccea7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
        menu = [
            ("m1", "Original Takoyaki 12pcs", "Octopus filling.", 129, "takoyaki", 30),
            ("m2", "Original Takoyaki 8pcs", "Octopus filling, smaller serving.", 99, "takoyaki", 30),
            ("m3", "Ebiyaki 12pcs", "Shrimp filling.", 129, "takoyaki", 25),
            ("m4", "Ebiyaki 8pcs", "Shrimp filling, smaller serving.", 99, "takoyaki", 25),
            ("m7", "Gyoza 10pcs", "Pan-fried Japanese dumplings.", 99, "fried", 40),
            ("m8", "Korokke 3pcs", "Japanese breaded croquette.", 129, "fried", 20),
            ("m9", "Okonomiyaki", "Japanese savory pancake.", 119, "okonomiyaki", 15),
            ("m10", "Yakisoba", "Japanese stir-fried noodles.", 119, "noodles", 18),
            ("m11", "Taiyaki Cheese 6pcs", "Fish-shaped cake with cheese filling.", 119, "taiyaki", 24),
            ("m14", "Taiyaki Mix 6pcs", "Assorted taiyaki.", 139, "taiyaki", 15),
            ("m15", "Tonkatsu", "Japanese breaded pork cutlet.", 149, "tonkatsu", 18),
        ]
        for code, name, description, price, category, stock in menu:
            MenuItem.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": description,
                    "price": Decimal(price),
                    "category": category_map[category],
                    "image_url": image,
                    "stock": stock,
                    "active": True,
                },
            )

        for code, name, price in [
            ("ao1", "Extra Mayo", 10),
            ("ao2", "Extra Takoyaki Sauce", 10),
            ("ao3", "Extra Bonito Flakes", 15),
            ("ao6", "Extra Chili Oil", 10),
            ("ao8", "Extra Okonomiyaki Sauce", 10),
            ("ao9", "Extra Rice", 20),
            ("ao12", "Spicy", 0),
        ]:
            AddOn.objects.update_or_create(code=code, defaults={"name": name, "price": Decimal(price), "active": True})

        for sku, name, category, unit, stock, reorder, cost, supplier in [
            ("ING-001", "Chicken Thigh", "Meat", "kg", 18, 10, 220, "Magnolia"),
            ("ING-002", "Pork Belly (Liempo)", "Meat", "kg", 6, 12, 380, "Monterey"),
            ("ING-003", "Jasmine Rice", "Grains", "kg", 42, 25, 65, "Sunrise"),
            ("ING-004", "Egg Noodles", "Grains", "pack", 4, 15, 48, "Lucky Me"),
            ("ING-005", "Soy Sauce", "Condiments", "L", 9, 5, 95, "Silver Swan"),
            ("ING-007", "Kangkong", "Vegetables", "bundle", 0, 10, 15, "Local Market"),
        ]:
            InventoryItem.objects.update_or_create(
                sku=sku,
                defaults={"name": name, "category": category, "unit": unit, "stock": stock, "reorder": reorder, "cost": Decimal(cost), "supplier": supplier},
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))
