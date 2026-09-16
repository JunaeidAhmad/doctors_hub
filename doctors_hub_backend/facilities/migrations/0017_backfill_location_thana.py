from django.db import migrations


def backfill_location_thana(apps, schema_editor):
    Location = apps.get_model('facilities', 'Location')
    Thana = apps.get_model('facilities', 'Thana')

    DISTRICT_ALIASES = {
        'chittagong': 'Chattogram',
        'comilla': 'Cumilla',
        'bogra': 'Bogura',
        'jessore': 'Jashore',
        'barisal': 'Barishal',
        'ঢাকা': 'Dhaka',
        'চট্টগ্রাম': 'Chattogram',
        'সিলেট': 'Sylhet',
    }

    AREA_ALIASES = {
        'shaymoli': 'Shyamoli',
        'শ্যামলী': 'Shyamoli',
    }

    for loc in Location.objects.all():
        dist_name = (loc.district or '').strip()
        norm_dist = DISTRICT_ALIASES.get(dist_name.lower(), dist_name)
        area_name = (loc.area or '').strip()
        norm_area = AREA_ALIASES.get(area_name.lower(), area_name)

        thana = Thana.objects.filter(
            district__name__iexact=norm_dist,
            name__iexact=norm_area
        ).first()

        if not thana and norm_area:
            thana = Thana.objects.filter(
                district__name__iexact=norm_dist,
                bn_name__iexact=norm_area
            ).first()

        if not thana:
            # Fallback to Sadar or first thana for that district
            thana = Thana.objects.filter(
                district__name__iexact=norm_dist,
                name__icontains='Sadar'
            ).first() or Thana.objects.filter(district__name__iexact=norm_dist).first()

        if thana:
            loc.thana = thana
            loc.save(update_fields=['thana'])


def reverse_backfill(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('facilities', '0016_division_alter_diagnosticcentercategory_id_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_location_thana, reverse_backfill),
    ]
