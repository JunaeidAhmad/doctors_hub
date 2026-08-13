from rest_framework.generics import get_object_or_404
import uuid

class SlugOrPkLookupMixin:
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        try:
            uuid.UUID(str(lookup_value))
            filter_kwargs = {'pk': lookup_value}
        except ValueError:
            slug_field = getattr(self, 'slug_field', 'slug')
            filter_kwargs = {slug_field: lookup_value}
            
        obj = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj
