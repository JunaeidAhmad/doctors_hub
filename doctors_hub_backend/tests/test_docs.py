import pytest
from rest_framework import status


@pytest.mark.django_db
class TestOpenAPIDocumentationEndpoints:

    def test_schema_endpoint_returns_valid_openapi_yaml(self, client):
        response = client.get('/api/schema/')
        assert response.status_code == status.HTTP_200_OK
        content = response.content.decode('utf-8')
        assert 'openapi: 3.0' in content
        assert "Doctor's Hub API" in content
        assert '/api/search-metadata/' in content
        assert '/api/auth/login/' in content

    def test_swagger_ui_endpoint_accessible(self, client):
        response = client.get('/api/docs/')
        assert response.status_code == status.HTTP_200_OK
        content = response.content.decode('utf-8')
        assert 'swagger-ui' in content.lower() or 'swagger' in content.lower()

    def test_redoc_endpoint_accessible(self, client):
        response = client.get('/api/redoc/')
        assert response.status_code == status.HTTP_200_OK
        content = response.content.decode('utf-8')
        assert 'redoc' in content.lower()
