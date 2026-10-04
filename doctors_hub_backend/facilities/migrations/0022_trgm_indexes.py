from django.db import migrations

INDEXES = [
    # (table, column, index_name)
    ('doctors_doctor', 'name', 'idx_doctor_name_trgm'),
    ('doctors_doctor', 'bn_name', 'idx_doctor_bn_name_trgm'),
    ('doctors_doctor', 'qualification', 'idx_doctor_qualification_trgm'),
    ('doctors_doctorspecialty', 'name', 'idx_specialty_name_trgm'),
    ('doctors_doctorspecialty', 'bn_name', 'idx_specialty_bn_name_trgm'),
    ('facilities_location', 'name', 'idx_location_name_trgm'),
    ('facilities_location', 'branch', 'idx_location_branch_trgm'),
    ('facilities_location', 'address_line', 'idx_location_address_trgm'),
    ('tests_test', 'name', 'idx_test_name_trgm'),
    ('tests_test', 'code', 'idx_test_code_trgm'),
    ('facilities_thana', 'name', 'idx_thana_name_trgm'),
    ('facilities_thana', 'bn_name', 'idx_thana_bn_name_trgm'),
]


def create_trgm_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return
    with schema_editor.connection.cursor() as cursor:
        for table, column, index_name in INDEXES:
            cursor.execute(
                f'CREATE INDEX IF NOT EXISTS {index_name} ON {table} USING gin (UPPER({column}) gin_trgm_ops);'
            )


def drop_trgm_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return
    with schema_editor.connection.cursor() as cursor:
        for table, column, index_name in INDEXES:
            cursor.execute(f'DROP INDEX IF EXISTS {index_name};')


class Migration(migrations.Migration):

    dependencies = [
        ('facilities', '0021_enable_pg_trgm'),
    ]

    operations = [
        migrations.RunPython(create_trgm_indexes, drop_trgm_indexes),
    ]
