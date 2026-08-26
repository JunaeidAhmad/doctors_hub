from django.core.cache import cache
from accounts.models import Role

def get_user_permissions(user):
    """
    Returns the effective permissions and scopes for a user.
    The result is a dictionary:
    {
        "module.action": ["global", "facility", "self"]
    }
    """
    if not user.is_authenticated:
        return {}
        
    cache_key = f"user_permissions_{user.id}"
    cached_perms = cache.get(cache_key)
    if cached_perms is not None:
        return cached_perms
        
    perms = {}
    
    # Super admins have all permissions with global scope
    if getattr(user, 'is_superuser', False) or getattr(user, 'is_super_admin', False):
        from accounts.models import Permission
        for p in Permission.objects.all():
            perms[f"{p.module}.{p.action}"] = [Role.ScopeType.GLOBAL]
        cache.set(cache_key, perms, timeout=3600)
        return perms

    # Get all active assignments for this user where the role is active
    assignments = user.user_roles.filter(role__is_active=True).select_related('role').prefetch_related('role__permissions')
    
    for assignment in assignments:
        role = assignment.role
        scope = role.scope_type
        
        for p in role.permissions.all():
            perm_key = f"{p.module}.{p.action}"
            if perm_key not in perms:
                perms[perm_key] = set()
            perms[perm_key].add(scope)
            
    # Convert sets to lists for JSON serialization / caching
    for k in perms:
        perms[k] = list(perms[k])
        
    cache.set(cache_key, perms, timeout=3600)
    return perms

def clear_user_permissions_cache(user_id):
    cache.delete(f"user_permissions_{user_id}")

def has_permission(user, module, action):
    if getattr(user, 'is_superuser', False):
        return True
        
    perms = get_user_permissions(user)
    perm_key = f"{module}.{action}"
    return perm_key in perms

def get_scope_for_permission(user, module, action):
    """
    Returns the list of scopes a user has for a given permission.
    E.g. ['global'], ['facility', 'self'], etc.
    """
    if getattr(user, 'is_superuser', False):
        return [Role.ScopeType.GLOBAL]
        
    perms = get_user_permissions(user)
    perm_key = f"{module}.{action}"
    return perms.get(perm_key, [])
