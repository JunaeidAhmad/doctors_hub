"""Schema-only shared response shapes (plan V.4.3/V.4.4).

Leaf serializers describing values already returned by various views.
Used with @extend_schema / @extend_schema_field only — never for validation.
Fields are deliberately not read_only so they stay in the schema `required`
list (see COMPONENT_NO_READ_ONLY_REQUIRED).
"""
from rest_framework import serializers


class SpecialtyRefSerializer(serializers.Serializer):
    """Compact specialty reference ({id, slug, name, bn_name})."""
    id = serializers.UUIDField()
    slug = serializers.CharField()
    name = serializers.CharField()
    bn_name = serializers.CharField()


class SpecialtyParentRefSerializer(serializers.Serializer):
    """Parent specialty reference ({id, slug, name})."""
    id = serializers.UUIDField()
    slug = serializers.CharField()
    name = serializers.CharField()


class SpecialtyDisplaySerializer(serializers.Serializer):
    """Bilingual specialty display strings ({en, bn})."""
    en = serializers.CharField()
    bn = serializers.CharField()


class NextAvailableSerializer(serializers.Serializer):
    """Next available session summary (see doctors.services.availability)."""
    date = serializers.CharField()
    session_key = serializers.CharField()
    session_start = serializers.CharField()
    start_time = serializers.CharField()
    estimated_time = serializers.CharField()
    remaining = serializers.IntegerField()
    capacity_remaining = serializers.IntegerField()


class OwnershipFacetSerializer(serializers.Serializer):
    private = serializers.IntegerField()
    government = serializers.IntegerField()
    hospital_affiliated = serializers.IntegerField()
    ngo = serializers.IntegerField()


class FulfillmentFacetSerializer(serializers.Serializer):
    home = serializers.IntegerField()
    center = serializers.IntegerField()


class SearchFacetsSerializer(serializers.Serializer):
    """Facet counts from tests.search.build_facets."""
    ownership = OwnershipFacetSerializer()
    fulfillment = FulfillmentFacetSerializer()
