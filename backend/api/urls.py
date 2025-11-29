from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ProjectViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'project', ProjectViewSet)
router.register(r'task', TaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
