from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Task, TaskDependency

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class TaskDependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskDependency
        fields = ['id', 'task', 'dependent_on_task', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 'priority', 
                  'project', 'assigned_user', 'is_completed', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.assigned_user:
            representation['assigned_user'] = {
                'id': instance.assigned_user.id,
                'username': instance.assigned_user.username,
                'email': instance.assigned_user.email,
                'first_name': instance.assigned_user.first_name,
                'last_name': instance.assigned_user.last_name
            }
        return representation

class TaskDetailSerializer(TaskSerializer):
    dependencies = serializers.SerializerMethodField()
    
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ['dependencies']
    
    def get_dependencies(self, obj):
        dependencies = TaskDependency.objects.filter(task=obj)
        return [dep.dependent_on_task.id for dep in dependencies]

class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 
                  'is_completed', 'tasks', 'created_at', 'updated_at']

class ProjectListSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 
                  'is_completed', 'task_count', 'created_at', 'updated_at']
    
    def get_task_count(self, obj):
        return obj.tasks.count()
