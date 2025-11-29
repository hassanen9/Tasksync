from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Project, Task, TaskDependency, UserProfile, ProjectMember
from .serializers import (
    UserSerializer,
    ProjectSerializer, 
    ProjectListSerializer,
    TaskSerializer, 
    TaskDetailSerializer, 
    TaskDependencySerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    ProjectJoinSerializer,
    ProjectMemberSerializer
)

# Custom permission classes
class IsProjectManagerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow project managers to create/update projects
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Creating projects requires the user to be a Project Manager
        if view.action == 'create':
            return hasattr(request.user, 'profile') and request.user.profile.role == 'project_manager'
            
        return True
        
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            # Check if user is a member of the project
            return ProjectMember.objects.filter(user=request.user, project=obj).exists()
            
        # Only the project manager can edit the project
        return obj.manager == request.user

class IsTaskAssigneeOrProjectManager(permissions.BasePermission):
    """
    Custom permission to only allow task assignees or project managers to modify tasks
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            # Check if user is a member of the project
            return ProjectMember.objects.filter(user=request.user, project=obj.project).exists()
            
        # Check if user is the project manager or task assignee
        is_project_manager = obj.project.manager == request.user
        is_task_assignee = obj.assigned_user == request.user
        
        return is_project_manager or is_task_assignee

# Authentication Views
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get the current user's info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'], parser_classes=[MultiPartParser, FormParser])
    def update_profile(self, request):
        """Update the user's profile"""
        user_profile = request.user.profile
        serializer = UserProfileUpdateSerializer(user_profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # Handle profile picture upload if provided
            if 'profile_picture' in request.FILES:
                user_profile.profile_picture = request.FILES['profile_picture']
                user_profile.save()
                
            return Response(UserProfileSerializer(user_profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change the user's password"""
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            # Check old password
            if not user.check_password(serializer.data.get('old_password')):
                return Response({'detail': 'Wrong password'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(serializer.data.get('new_password'))
            user.save()
            return Response({'detail': 'Password changed successfully'})
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    permission_classes = [IsAuthenticated, IsProjectManagerOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
      def get_queryset(self):
        """
        This view should return a list of all projects for which the 
        current authenticated user is a member or a manager
        """
        user = self.request.user
        # Project managers can see all their managed projects
        # Developers can see all projects they are members of
        return Project.objects.filter(
            Q(manager=user) | Q(members__user=user)
        ).distinct()
    
    def perform_create(self, serializer):
        """Set the project manager to the current user"""
        serializer.save(manager=self.request.user)
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Get all tasks for a specific project"""
        project = self.get_object()
        tasks = Task.objects.filter(project=project)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['post'])
    def join(self, request):
        """Join a project using an access code"""
        serializer = ProjectJoinSerializer(data=request.data)
        if serializer.is_valid():
            access_code = serializer.validated_data['access_code']
            
            try:
                project = Project.objects.get(access_code=access_code)
                
                # Check if user is already a member
                if ProjectMember.objects.filter(user=request.user, project=project).exists():
                    return Response({'detail': 'You are already a member of this project'}, 
                                   status=status.HTTP_400_BAD_REQUEST)
                
                # Add user to project members
                ProjectMember.objects.create(user=request.user, project=project)
                
                return Response({'detail': f'Successfully joined project: {project.name}'})
                
            except Project.DoesNotExist:
                return Response({'detail': 'Invalid access code'}, 
                               status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a project"""
        project = self.get_object()
        members = ProjectMember.objects.filter(project=project)
        serializer = ProjectMemberSerializer(members, many=True)
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
