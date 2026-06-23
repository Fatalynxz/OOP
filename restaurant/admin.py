from django.contrib import admin

from .models import AddOn, AppSetting, InventoryItem, MenuCategory, MenuItem, Order, OrderItem, OrderItemAddOn, RecipeIngredient, StaffUser


admin.site.register([StaffUser, MenuCategory, MenuItem, AddOn, Order, OrderItem, OrderItemAddOn, InventoryItem, RecipeIngredient, AppSetting])
