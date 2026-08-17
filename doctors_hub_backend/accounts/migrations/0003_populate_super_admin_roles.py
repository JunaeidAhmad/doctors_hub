from django.db import migrations


def set_super_admin_roles(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    # Set super_admin role for existing superusers
    User.objects.filter(is_superuser=True).update(role='super_admin')


def unset_super_admin_roles(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_role'),
    ]

    operations = [
        migrations.RunPython(set_super_admin_roles, reverse_code=unset_super_admin_roles),
    ]
