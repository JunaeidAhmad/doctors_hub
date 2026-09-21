from rest_framework.generics import get_object_or_404
from django.http import Http404
import uuid

class SlugOrPkLookupMixin:
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        try:
            uuid.UUID(str(lookup_value))
            obj = get_object_or_404(queryset, pk=lookup_value)
        except ValueError:
            slug_field = getattr(self, 'slug_field', 'slug')
            obj = queryset.filter(**{slug_field: lookup_value}).first()
            if not obj and hasattr(queryset.model, 'old_slugs'):
                obj = queryset.filter(old_slugs__contains=lookup_value).first()
            if not obj:
                raise Http404(f"No {queryset.model._meta.object_name} found matching the query")
            
        self.check_object_permissions(self.request, obj)
        return obj

