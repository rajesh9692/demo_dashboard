from django.contrib import admin
from .models import Contract, CycleTime

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('serial', 'name', 'value', 'status', 'type', 'stage', 'expiry_date')

@admin.register(CycleTime)
class CycleTimeAdmin(admin.ModelAdmin):
    list_display = ('contract_type', 'average_days')

