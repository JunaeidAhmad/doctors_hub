from django.core.management.base import BaseCommand
from accounts.models import Permission, Role, User, UserRole

class Command(BaseCommand):
    help = 'Seeds the database with the predefined permission catalog and seeds only the superadmin role'

    def handle(self, *args, **kwargs):
        # Catalog definition
        # Module -> {action: (label, is_facility_grantable)}
        modules = {
            'dashboard': {'view': ('View Dashboard', True)},
            'doctors': {
                'view': ('View Doctors', True),
                'create': ('Create Doctors', True),
                'edit': ('Edit Doctors', True),
                'delete': ('Delete Doctors', True),
            },
            'hospitals': {
                'view': ('View Hospitals', False),
                'create': ('Create Hospitals', False),
                'edit': ('Edit Hospitals', False),
                'delete': ('Delete Hospitals', False),
            },
            'diagnostic_centers': {
                'view': ('View Diagnostic Centers', False),
                'create': ('Create Diagnostic Centers', False),
                'edit': ('Edit Diagnostic Centers', False),
                'delete': ('Delete Diagnostic Centers', False),
            },
            'tests': {
                'view': ('View Tests', False),
                'create': ('Create Tests', False),
                'edit': ('Edit Tests', False),
                'delete': ('Delete Tests', False),
            },
            'services': {
                'view': ('View Services', False),
                'create': ('Create Services', False),
                'edit': ('Edit Services', False),
                'delete': ('Delete Services', False),
            },
            'offerings': {
                'view': ('View Offerings', True),
                'create': ('Create Offerings', True),
                'edit': ('Edit Offerings', True),
                'delete': ('Delete Offerings', True),
            },
            'pricing': {
                'view': ('View Pricing', True),
                'create': ('Create Pricing', True),
                'edit': ('Edit Pricing', True),
                'delete': ('Delete Pricing', True),
            },
            'bookings': {
                'view': ('View Bookings', True),
                'create': ('Create Bookings', True),
                'edit': ('Edit Bookings', True),
                'delete': ('Delete Bookings', True),
            },
            'users': {
                'view': ('View Users', False),
                'create': ('Create Users', False),
                'edit': ('Edit Users', False),
                'delete': ('Delete Users', False),
            },
            'roles': {
                'view': ('View Roles', True),
                'create': ('Create Roles', True),
                'edit': ('Edit Roles', True),
                'delete': ('Delete Roles', True),
            },
            'categories': {
                'view': ('View Categories', False),
                'create': ('Create Categories', False),
                'edit': ('Edit Categories', False),
                'delete': ('Delete Categories', False),
            },
            'locations': {
                'view': ('View Locations', False),
                'create': ('Create Locations', False),
                'edit': ('Edit Locations', False),
                'delete': ('Delete Locations', False),
            },
            'verifications': {
                'view': ('View Verifications', False),
                'create': ('Create Verifications', False),
                'edit': ('Edit Verifications', False),
                'delete': ('Delete Verifications', False),
                'verify': ('Perform Verification', False),
            },
            'reports': {
                'view': ('View Reports', False),
                'export': ('Export Reports', False),
            },
        }

        created_count = 0
        updated_count = 0

        for module, actions in modules.items():
            for action, (label, is_facility_grantable) in actions.items():
                codename = f"{module}.{action}"
                perm, created = Permission.objects.update_or_create(
                    module=module,
                    action=action,
                    defaults={
                        'codename': codename,
                        'label': label,
                        'is_facility_grantable': is_facility_grantable
                    }
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully synced permissions. Created: {created_count}, Updated: {updated_count}'))

        # Seed only the Super Admin system role
        super_admin_role, role_created = Role.objects.get_or_create(
            name="Super Admin",
            defaults={
                'description': 'Platform Super Administrator with full global access.',
                'scope_type': Role.ScopeType.GLOBAL,
                'is_system': True,
                'is_active': True,
                'owner_facility': None,
            }
        )
        # Super admin holds all permissions
        all_permissions = Permission.objects.all()
        super_admin_role.permissions.set(all_permissions)
        
        # Link existing superusers to Super Admin role
        for superuser in User.objects.filter(is_superuser=True):
            UserRole.objects.get_or_create(
                user=superuser,
                role=super_admin_role,
                facility=None
            )

        self.stdout.write(self.style.SUCCESS(f'Successfully synced Super Admin role with all {all_permissions.count()} permissions.'))
