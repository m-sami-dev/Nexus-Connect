from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, StartupPitch, ConnectionRequest, Meeting, Document, Transaction


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'wallet_balance', 'is_2fa_enabled', 'is_staff')
    list_filter = ('role', 'is_2fa_enabled', 'is_staff')
    search_fields = ('username', 'email')
    fieldsets = UserAdmin.fieldsets + (
        ('Nexus Profile', {'fields': ('role', 'bio', 'profile_picture', 'company_name', 'industry')}),
        ('Wallet & Security', {'fields': ('wallet_balance', 'is_2fa_enabled')}),
    )


@admin.register(StartupPitch)
class StartupPitchAdmin(admin.ModelAdmin):
    list_display = ('title', 'entrepreneur', 'industry', 'funding_goal', 'created_at')
    list_filter = ('industry',)
    search_fields = ('title', 'entrepreneur__username')


@admin.register(ConnectionRequest)
class ConnectionRequestAdmin(admin.ModelAdmin):
    list_display = ('investor', 'entrepreneur', 'pitch', 'status', 'created_at')
    list_filter = ('status',)


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'participant', 'start_time', 'end_time', 'status')
    list_filter = ('status',)


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'status', 'uploaded_at')
    list_filter = ('status',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_type', 'sender', 'receiver', 'amount', 'status', 'timestamp')
    list_filter = ('transaction_type', 'status')