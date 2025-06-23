from django.db import models

class Contract(models.Model):
    serial = models.CharField(max_length=20)
    name = models.CharField(max_length=100)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)
    type = models.CharField(max_length=50)
    stage = models.CharField(max_length=50)
    expiry_date = models.DateField()

    def __str__(self):
        return f"{self.serial} - {self.name}"

class CycleTime(models.Model):
    contract_type = models.CharField(max_length=100)
    average_days = models.IntegerField()
    
    def __str__(self):
        return self.contract_type