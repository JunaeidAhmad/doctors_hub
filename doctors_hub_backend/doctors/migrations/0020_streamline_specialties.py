import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('doctors', '0019_remove_components'),
    ]

    operations = [
        migrations.AddField(
            model_name='doctor',
            name='specialty_source',
            field=models.TextField(blank=True, default='', help_text='Verbatim text from card or brochure'),
        ),
        migrations.AddField(
            model_name='doctor',
            name='specialty_source_bn',
            field=models.TextField(blank=True, default='', help_text='Verbatim Bengali text from card or brochure'),
        ),
        migrations.AddField(
            model_name='doctor',
            name='primary_specialty',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='primary_doctors',
                to='doctors.doctorspecialty',
            ),
        ),
        migrations.RemoveField(
            model_name='doctor',
            name='provider_type',
        ),
        migrations.RemoveField(
            model_name='doctorspecialty',
            name='provider_type',
        ),
        migrations.DeleteModel(
            name='DoctorSpecialtyClaim',
        ),
        migrations.DeleteModel(
            name='LegacySpecialtySlug',
        ),
    ]
