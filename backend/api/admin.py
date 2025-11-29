from django.contrib import admin
from .models import Project, Task, TaskDependency

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'is_completed', 'created_at')
    list_filter = ('is_completed', 'start_date')
    search_fields = ('name', 'description')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'assigned_user', 'priority', 'start_date', 'end_date', 'is_completed')
    list_filter = ('priority', 'is_completed', 'project')
    search_fields = ('name', 'description')

@admin.register(TaskDependency)
class TaskDependencyAdmin(admin.ModelAdmin):
    list_display = ('task', 'dependent_on_task', 'created_at')
    list_filter = ('created_at',)
