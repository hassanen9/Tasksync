from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class Task(models.Model):
    PRIORITY_CHOICES = [
        (1, 'Low'),
        (2, 'Medium'),
        (3, 'High'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=2)  # Medium as default
    project = models.ForeignKey(Project, related_name='tasks', on_delete=models.CASCADE)
    assigned_user = models.ForeignKey(User, related_name='assigned_tasks', on_delete=models.SET_NULL, null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class TaskDependency(models.Model):
    task = models.ForeignKey(Task, related_name='dependencies', on_delete=models.CASCADE)
    dependent_on_task = models.ForeignKey(Task, related_name='dependents', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('task', 'dependent_on_task')
        
    def __str__(self):
        return f"{self.task.name} depends on {self.dependent_on_task.name}"
