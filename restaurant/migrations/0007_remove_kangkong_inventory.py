from django.db import migrations


def remove_kangkong(apps, schema_editor):
    InventoryItem = apps.get_model("restaurant", "InventoryItem")
    InventoryItem.objects.filter(sku="ING-007", name="Kangkong").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("restaurant", "0006_seed_addon_ingredients"),
    ]

    operations = [
        migrations.RunPython(remove_kangkong, migrations.RunPython.noop),
    ]
