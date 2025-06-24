from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import *
import json
from datetime import date
from decimal import Decimal



def dashboard_view(request):
    contracts = Contract.objects.all().order_by('-id')  # latest first
    return render(request, 'dashboard/index.html', {'contracts': contracts})



from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Contract  # Make sure your Contract model is imported
import json

@csrf_exempt
def add_contract(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Convert float or string to Decimal
            raw_value = data.get('value')
            if raw_value is None:
                return JsonResponse({'error': 'Value is required'}, status=400)

            value = Decimal(str(raw_value))  # ✅ Critical conversion

            Contract.objects.create(
                serial=data.get('serial'),
                name=data.get('name'),
                value=value,
                status=data.get('status'),
                type=data.get('type'),
                expiry_date=data.get('expiry_date')
            )

            return JsonResponse({'message': 'Contract added successfully!'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)



@csrf_exempt
def get_contracts(request):
    if request.method == 'GET':
        contracts = (
            Contract.objects.all()
            .order_by('-id')[:7]  # ✅ Most recent 7 entries
            .values('serial', 'name', 'value', 'status')
        )
        return JsonResponse(list(contracts), safe=False)


@csrf_exempt
def contract_by_stage(request):
    statuses = ['Active', 'Draft', 'Cancel']
    data = {status: Contract.objects.filter(status=status).count() for status in statuses}

    # Count expired contracts
    today = date.today()
    expired_count = Contract.objects.filter(expiry_date__lt=today).count()
    data['Expired'] = expired_count

    return JsonResponse(data)

from datetime import datetime, timedelta

def contract_expiry_summary(request):
    today = date.today()
    in_15 = today + timedelta(days=15)
    in_30 = today + timedelta(days=30)

    expired = Contract.objects.filter(expiry_date__lt=today).count()
    within_15 = Contract.objects.filter(expiry_date__gte=today, expiry_date__lte=in_15).count()
    within_30 = Contract.objects.filter(expiry_date__gt=in_15, expiry_date__lte=in_30).count()
    over_30 = Contract.objects.filter(expiry_date__gt=in_30).count()

    data = {
        'Expired': expired,
        '≤15 Days': within_15,
        '15–30 Days': within_30,
        '>30 Days': over_30
    }
    return JsonResponse(data)



def contract_type_percentage(request):
    type_labels = [
        'NDA', 'Insurance', 'Lease',
        'Maintenance', 'Purchase Agreement', 'Sale'
    ]
    total = Contract.objects.count()

    data = {}
    for t in type_labels:
        count = Contract.objects.filter(type=t).count()
        percent = (count / total) * 100 if total else 0
        data[t] = round(percent, 2)

    return JsonResponse(data)