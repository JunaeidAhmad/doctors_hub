import math
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import NotFound
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class SearchPagination(PageNumberPagination):
    page_size = 4
    max_page_size = 50
    page_size_query_param = 'page_size'

    def paginate_queryset(self, queryset, request, view=None):
        self.request = request
        try:
            return super().paginate_queryset(queryset, request, view=view)
        except NotFound:
            try:
                self.count = queryset.count() if hasattr(queryset, 'count') else len(queryset)
            except Exception:
                self.count = 0
            page_size = self.get_page_size(request) or self.page_size
            self.total_pages = math.ceil(self.count / page_size) if self.count > 0 else 0
            raw_page = request.query_params.get(self.page_query_param, 1)
            try:
                self.page_num = int(raw_page)
            except (ValueError, TypeError):
                self.page_num = 1
            self.page = None
            return []

    def get_paginated_response(self, data, facets=None):
        if self.page is not None:
            total_pages = self.page.paginator.num_pages
            page_num = self.page.number
            page_size = self.get_page_size(self.request)
            count = self.page.paginator.count
            next_link = self.get_next_link()
            previous_link = self.get_previous_link()
        else:
            count = getattr(self, 'count', 0)
            total_pages = getattr(self, 'total_pages', 0)
            page_num = getattr(self, 'page_num', 1)
            page_size = self.get_page_size(self.request) or self.page_size
            next_link = None
            previous_link = None

        return Response({
            'count': count,
            'total_pages': total_pages,
            'page': page_num,
            'page_size': page_size,
            'next': next_link,
            'previous': previous_link,
            'facets': facets or {},
            'results': data
        })


class FacilityDoctorPagination(SearchPagination):
    page_size = 12
    max_page_size = 50
    page_size_query_param = 'page_size'

