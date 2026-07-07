import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexus_backend.settings')

from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import authentication.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            authentication.routing.websocket_urlpatterns
        )
    ),
})
