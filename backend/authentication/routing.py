from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Room name ke through connect hoga: ws://localhost:8000/ws/video/<room_name>/
    re_path(r'ws/video/(?P<room_name>\w+)/$', consumers.VideoCallConsumer.as_asgi()),
]