from decimal import Decimal

from django.db import migrations

from restaurant.bom_seed import seed_bom


def seed_addon_ingredients(apps, schema_editor):
    AddOn = apps.get_model("restaurant", "AddOn")
    InventoryItem = apps.get_model("restaurant", "InventoryItem")
    MenuItem = apps.get_model("restaurant", "MenuItem")
    RecipeIngredient = apps.get_model("restaurant", "RecipeIngredient")

    for code, name, price in [
        ("ao1", "Extra Mayo", 10),
        ("ao2", "Extra Takoyaki Sauce", 10),
        ("ao3", "Extra Bonito Flakes", 15),
        ("ao4", "Extra Aonori", 10),
        ("ao5", "Extra Gyoza Sauce", 10),
        ("ao6", "Extra Chili Oil", 10),
        ("ao7", "Extra Tonkatsu Sauce", 10),
        ("ao8", "Extra Okonomiyaki Sauce", 10),
        ("ao9", "Extra Rice", 20),
        ("ao10", "Extra Egg", 15),
        ("ao11", "Extra Cabbage", 15),
        ("ao12", "Spicy", 0),
    ]:
        AddOn.objects.update_or_create(
            code=code,
            defaults={"name": name, "price": Decimal(price), "active": True},
        )

    seed_bom(InventoryItem, MenuItem, RecipeIngredient)


class Migration(migrations.Migration):

    dependencies = [
        ("restaurant", "0005_seed_recipe_bom"),
    ]

    operations = [
        migrations.RunPython(seed_addon_ingredients, migrations.RunPython.noop),
    ]
