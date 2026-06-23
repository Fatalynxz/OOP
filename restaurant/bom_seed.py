from decimal import Decimal


INGREDIENTS = [
    ("ING-101", "All Purpose Flour", "Dry Goods", "g", 50000, 5000, "0.08", "Local Market"),
    ("ING-102", "Baking Powder", "Dry Goods", "g", 5000, 500, "0.12", "Local Market"),
    ("ING-103", "Sugar", "Dry Goods", "g", 20000, 3000, "0.06", "Local Market"),
    ("ING-104", "Egg", "Dairy", "pc", 300, 60, "8.00", "Local Market"),
    ("ING-105", "Dashi Powder", "Dry Goods", "g", 5000, 600, "0.70", "Japanese Supplier"),
    ("ING-106", "Water", "Utility", "ml", 100000, 10000, "0.01", "Store Supply"),
    ("ING-107", "Green Onions", "Vegetables", "g", 6000, 800, "0.18", "Local Market"),
    ("ING-108", "Shoga", "Condiments", "g", 3000, 400, "0.25", "Japanese Supplier"),
    ("ING-109", "Tenkasu Crackers", "Dry Goods", "g", 6000, 800, "0.22", "Japanese Supplier"),
    ("ING-110", "Octopus", "Seafood", "g", 12000, 2000, "0.95", "Seafood Supplier"),
    ("ING-111", "Cheese", "Dairy", "g", 12000, 2000, "0.40", "Dairy Supplier"),
    ("ING-112", "Veggies", "Vegetables", "g", 10000, 1500, "0.14", "Local Market"),
    ("ING-113", "Shrimp", "Seafood", "g", 12000, 2000, "0.85", "Seafood Supplier"),
    ("ING-114", "Takoyaki Sauce", "Sauces", "ml", 10000, 1500, "0.30", "Japanese Supplier"),
    ("ING-115", "Aonori", "Dry Goods", "g", 1500, 200, "1.20", "Japanese Supplier"),
    ("ING-116", "Katsubushi", "Dry Goods", "g", 2500, 300, "1.10", "Japanese Supplier"),
    ("ING-117", "Cheese Sauce", "Sauces", "ml", 8000, 1200, "0.35", "Dairy Supplier"),
    ("ING-118", "Cabbage", "Vegetables", "g", 30000, 5000, "0.08", "Local Market"),
    ("ING-119", "Minced Pork", "Meat", "g", 15000, 2500, "0.32", "Meat Supplier"),
    ("ING-120", "Garlic", "Vegetables", "g", 3000, 500, "0.16", "Local Market"),
    ("ING-121", "Ginger", "Vegetables", "g", 3000, 500, "0.18", "Local Market"),
    ("ING-122", "Potato", "Vegetables", "g", 25000, 4000, "0.06", "Local Market"),
    ("ING-123", "Minced Beef", "Meat", "g", 12000, 2000, "0.45", "Meat Supplier"),
    ("ING-124", "Gyoza Wrapper", "Dry Goods", "pc", 1000, 200, "2.50", "Japanese Supplier"),
    ("ING-125", "Breadcrumbs", "Dry Goods", "g", 12000, 2000, "0.12", "Bakery Supplier"),
    ("ING-126", "Fresh Noodles", "Noodles", "g", 25000, 4000, "0.18", "Noodle Supplier"),
    ("ING-127", "White Onions", "Vegetables", "g", 15000, 2500, "0.10", "Local Market"),
    ("ING-128", "Porkbelly Slice", "Meat", "g", 15000, 2500, "0.38", "Meat Supplier"),
    ("ING-129", "Yakisoba Sauce", "Sauces", "ml", 10000, 1500, "0.32", "Japanese Supplier"),
    ("ING-130", "Pancake Batter", "Dry Goods", "g", 20000, 3000, "0.12", "Bakery Supplier"),
    ("ING-131", "Redbeans", "Filling", "g", 8000, 1200, "0.24", "Japanese Supplier"),
    ("ING-132", "Ube", "Filling", "g", 8000, 1200, "0.24", "Local Market"),
    ("ING-133", "Chocolate", "Filling", "g", 8000, 1200, "0.26", "Bakery Supplier"),
    ("ING-134", "Butter", "Dairy", "g", 5000, 800, "0.35", "Dairy Supplier"),
    ("ING-135", "Pork Chop", "Meat", "g", 15000, 2500, "0.35", "Meat Supplier"),
    ("ING-136", "Oil", "Cooking", "ml", 20000, 3000, "0.12", "Cooking Supplier"),
    ("ING-137", "Tonkatsu Sauce", "Sauces", "ml", 8000, 1200, "0.32", "Japanese Supplier"),
    ("ING-138", "Salt", "Dry Goods", "g", 5000, 700, "0.03", "Local Market"),
    ("ING-139", "Pepper", "Dry Goods", "g", 3000, 400, "0.18", "Local Market"),
    ("ING-140", "Coffee", "Beverages", "ml", 10000, 1500, "0.20", "Beverage Supplier"),
    ("ING-141", "Milk", "Beverages", "ml", 15000, 2500, "0.12", "Dairy Supplier"),
    ("ING-142", "Coke", "Beverages", "ml", 12000, 2000, "0.08", "Beverage Supplier"),
    ("ING-143", "Ice Cream", "Dairy", "g", 8000, 1200, "0.22", "Dairy Supplier"),
    ("ING-144", "Ice", "Beverages", "pc", 1500, 250, "0.50", "Store Supply"),
    ("ING-145", "Mayo", "Sauces", "ml", 8000, 1200, "0.22", "Grocery Supplier"),
    ("ING-146", "Gyoza Sauce", "Sauces", "ml", 8000, 1200, "0.28", "Japanese Supplier"),
    ("ING-147", "Chili Oil", "Sauces", "ml", 5000, 700, "0.35", "Japanese Supplier"),
    ("ING-148", "Okonomiyaki Sauce", "Sauces", "ml", 8000, 1200, "0.32", "Japanese Supplier"),
    ("ING-149", "Rice", "Grains", "g", 50000, 8000, "0.06", "Local Market"),
    ("ING-150", "Spicy Powder", "Dry Goods", "g", 3000, 400, "0.20", "Japanese Supplier"),
]

TAKO_BASE = {
    "All Purpose Flour": 45,
    "Baking Powder": 2,
    "Sugar": 3,
    "Egg": 1,
    "Dashi Powder": 2,
    "Water": 100,
    "Green Onions": 10,
    "Tenkasu Crackers": 15,
    "Takoyaki Sauce": 20,
    "Aonori": 1,
    "Katsubushi": 3,
}


def scaled(recipe, factor):
    return {name: max(1, round(qty * factor)) for name, qty in recipe.items()}


def tako_recipe(filling, filling_qty, factor=1):
    recipe = scaled(TAKO_BASE, factor)
    recipe[filling] = filling_qty
    return recipe


RECIPES = {
    "Takoyaki (Octobits) 6pcs": tako_recipe("Octopus", 30, 1),
    "Takoyaki (Octobits) 12pcs": tako_recipe("Octopus", 60, 2),
    "Takoyaki (Octobits) 16pcs": tako_recipe("Octopus", 80, 2.7),
    "Ebiyaki (Shrimp) 6pcs": tako_recipe("Shrimp", 30, 1),
    "Ebiyaki (Shrimp) 12pcs": tako_recipe("Shrimp", 60, 2),
    "Ebiyaki (Shrimp) 16pcs": tako_recipe("Shrimp", 80, 2.7),
    "Chizuyaki (Cheese) 6pcs": tako_recipe("Cheese", 35, 1),
    "Chizuyaki (Cheese) 12pcs": tako_recipe("Cheese", 70, 2),
    "Chizuyaki (Cheese) 16pcs": tako_recipe("Cheese", 95, 2.7),
    "Yasaiyaki (Veggies) 6pcs": tako_recipe("Veggies", 40, 1),
    "Yasaiyaki (Veggies) 12pcs": tako_recipe("Veggies", 80, 2),
    "Yasaiyaki (Veggies) 16pcs": tako_recipe("Veggies", 110, 2.7),
    "Half-half 12pcs": {**scaled(TAKO_BASE, 2), "Octopus": 30, "Shrimp": 30},
    "Half-half 16pcs": {**scaled(TAKO_BASE, 2.7), "Octopus": 40, "Shrimp": 40},
    "Gyoza 10pcs": {
        "Gyoza Wrapper": 10,
        "Minced Pork": 120,
        "Cabbage": 80,
        "Garlic": 5,
        "Ginger": 5,
        "Green Onions": 10,
    },
    "Korokke 3pcs": {
        "Potato": 250,
        "Minced Beef": 80,
        "White Onions": 30,
        "Breadcrumbs": 40,
        "Egg": 1,
        "All Purpose Flour": 20,
        "Oil": 20,
    },
    "Okonomiyaki": {
        "All Purpose Flour": 80,
        "Egg": 1,
        "Dashi Powder": 3,
        "Water": 80,
        "Cabbage": 150,
        "Minced Pork": 60,
        "Green Onions": 15,
        "Tenkasu Crackers": 15,
        "Takoyaki Sauce": 30,
        "Aonori": 1,
        "Katsubushi": 3,
        "Shoga": 10,
    },
    "Yakisoba": {
        "Fresh Noodles": 200,
        "White Onions": 50,
        "Porkbelly Slice": 80,
        "Cabbage": 80,
        "Yakisoba Sauce": 40,
        "Oil": 10,
        "Ginger": 5,
    },
    "Taiyaki Cheese 6pcs": {"Pancake Batter": 180, "Egg": 1, "Sugar": 15, "Butter": 10, "Cheese": 60},
    "Taiyaki Ube 6pcs": {"Pancake Batter": 180, "Egg": 1, "Sugar": 15, "Butter": 10, "Ube": 60},
    "Taiyaki Red Beans 6pcs": {"Pancake Batter": 180, "Egg": 1, "Sugar": 15, "Butter": 10, "Redbeans": 60},
    "Taiyaki Mix 6pcs": {
        "Pancake Batter": 180,
        "Egg": 1,
        "Sugar": 15,
        "Butter": 10,
        "Cheese": 20,
        "Ube": 20,
        "Redbeans": 20,
    },
    "Tonkatsu": {
        "Pork Chop": 180,
        "All Purpose Flour": 25,
        "Egg": 1,
        "Breadcrumbs": 50,
        "Oil": 60,
        "Tonkatsu Sauce": 25,
        "Salt": 2,
        "Pepper": 1,
    },
    "Ice Coffee 16oz": {"Coffee": 60, "Water": 180, "Sugar": 10, "Ice": 1},
    "Ice Spanish Latte 16oz": {"Coffee": 60, "Milk": 160, "Sugar": 15, "Ice": 1},
    "Coffee Float 16oz": {"Coffee": 60, "Water": 140, "Sugar": 10, "Ice Cream": 80, "Ice": 1},
    "Coke Float 16oz": {"Coke": 250, "Ice Cream": 80, "Ice": 1},
    "Ice Choco 16oz": {"Chocolate": 35, "Milk": 180, "Sugar": 10, "Ice": 1},
    "Choco Float 16oz": {"Chocolate": 35, "Milk": 150, "Sugar": 10, "Ice Cream": 80, "Ice": 1},
}

ADD_ON_RECIPES = {
    "Extra Mayo": {"Mayo": 20},
    "Extra Takoyaki Sauce": {"Takoyaki Sauce": 20},
    "Extra Bonito Flakes": {"Katsubushi": 5},
    "Extra Aonori": {"Aonori": 2},
    "Extra Gyoza Sauce": {"Gyoza Sauce": 20},
    "Extra Chili Oil": {"Chili Oil": 15},
    "Extra Tonkatsu Sauce": {"Tonkatsu Sauce": 20},
    "Extra Okonomiyaki Sauce": {"Okonomiyaki Sauce": 20},
    "Extra Rice": {"Rice": 150},
    "Extra Egg": {"Egg": 1},
    "Extra Cabbage": {"Cabbage": 60},
    "Spicy": {"Spicy Powder": 3},
}


def seed_bom(InventoryItem, MenuItem, RecipeIngredient):
    ingredients_by_name = {}
    for sku, name, category, unit, stock, reorder, cost, supplier in INGREDIENTS:
        ingredient, _ = InventoryItem.objects.update_or_create(
            sku=sku,
            defaults={
                "name": name,
                "category": category,
                "unit": unit,
                "stock": stock,
                "reorder": reorder,
                "cost": Decimal(cost),
                "supplier": supplier,
            },
        )
        ingredients_by_name[name] = ingredient

    for menu_name, lines in RECIPES.items():
        menu_item = MenuItem.objects.filter(name=menu_name).first()
        if not menu_item:
            continue
        for ingredient_name, quantity in lines.items():
            ingredient = ingredients_by_name.get(ingredient_name)
            if ingredient:
                RecipeIngredient.objects.update_or_create(
                    menu_item=menu_item,
                    inventory_item=ingredient,
                    defaults={"quantity": quantity},
                )
