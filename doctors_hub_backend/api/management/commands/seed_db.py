from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Seeds database with complete dataset'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database via populate_mock_data...')
        call_command('populate_mock_data')
