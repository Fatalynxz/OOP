from decimal import Decimal

from django.db import migrations

from restaurant.bom_seed import seed_bom


def seed_recipe_bom(apps, schema_editor):
    InventoryItem = apps.get_model("restaurant", "InventoryItem")
    MenuCategory = apps.get_model("restaurant", "MenuCategory")
    MenuItem = apps.get_model("restaurant", "MenuItem")
    RecipeIngredient = apps.get_model("restaurant", "RecipeIngredient")

    taiyaki = MenuCategory.objects.filter(slug="taiyaki").first()
    if taiyaki:
        image = "https://images.unsplash.com/photo-1602030029545-52959ef2927c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
        for code, name, description, price, stock in [
            ("m12", "Taiyaki Ube 6pcs", "Fish-shaped cake with ube filling.", 129, 20),
            ("m13", "Taiyaki Red Beans 6pcs", "Fish-shaped cake with red bean filling.", 129, 20),
        ]:
            MenuItem.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": description,
                    "price": Decimal(price),
                    "category": taiyaki,
                    "image_url": image,
                    "stock": stock,
                    "active": True,
                },
            )

    seed_bom(InventoryItem, MenuItem, RecipeIngredient)


class Migration(migrations.Migration):

    dependencies = [
        ("restaurant", "0004_recipeingredient"),
    ]

    operations = [
        migrations.RunPython(seed_recipe_bom, migrations.RunPython.noop),
    ]
