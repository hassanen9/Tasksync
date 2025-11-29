from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Count
from .models import Project, Task, TaskDependency
from .serializers import (
    UserSerializer,
    ProjectSerializer, 
    ProjectListSerializer,
    TaskSerializer, 
    TaskDetailSerializer, 
    TaskDependencySerializer
)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Get all tasks for a specific project"""
        project = self.get_object()
        tasks = Task.objects.filter(project=project)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return TaskDetailSerializer
        return TaskSerializer
    
    def create(self, request, *args, **kwargs):
        """Custom create method to handle task creation with proper field mapping"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['get'])
    def dependencies(self, request):
        """Get all task dependencies"""
        dependencies = TaskDependency.objects.all()
        serializer = TaskDependencySerializer(dependencies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_dependency(self, request, pk=None):
        """Add a dependency to a task"""
        task = self.get_object()
        dependent_task_id = request.query_params.get('dependentOnTaskId')
        
        if not dependent_task_id:
            return Response({"error": "dependentOnTaskId parameter is required"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            dependent_task = Task.objects.get(pk=dependent_task_id)
        except Task.DoesNotExist:
            return Response({"error": "Dependent task not found"}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        # Prevent circular dependencies and self-dependencies
        if int(pk) == int(dependent_task_id):
            return Response({"error": "A task cannot depend on itself"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        dependency, created = TaskDependency.objects.get_or_create(
            task=task, 
            dependent_on_task=dependent_task
        )
        
        if created:
            return Response({"message": "Dependency added successfully"}, 
                           status=status.HTTP_201_CREATED)
        else:
            return Response({"message": "Dependency already exists"}, 
                           status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['delete'])
    def remove_dependency(self, request, pk=None):
        """Remove a dependency from a task"""
        task = self.get_object()
        dependent_task_id = request.query_params.get('dependentOnTaskId')
        
        if not dependent_task_id:
            return Response({"error": "dependentOnTaskId parameter is required"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            dependency = TaskDependency.objects.get(
                task=task, 
                dependent_on_task_id=dependent_task_id
            )
            dependency.delete()
            return Response({"message": "Dependency removed successfully"}, 
                         status=status.HTTP_200_OK)
        except TaskDependency.DoesNotExist:
            return Response({"error": "Dependency not found"}, 
                         status=status.HTTP_404_NOT_FOUND)
