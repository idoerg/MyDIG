from models import Image
from django.contrib import admin

class ImageAdmin(admin.ModelAdmin):
    search_fields = ["filename", "key_data"]
    list_display = ["filename", "image", "key_data"]
    list_filter = ["filename", "image", "key_data"]

admin.site.register(Image, ImageAdmin)
