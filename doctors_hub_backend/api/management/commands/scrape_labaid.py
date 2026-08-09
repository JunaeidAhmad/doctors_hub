import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from api.models import TestCategory, Test

class Command(BaseCommand):
    help = 'Scrape Labaid Diagnostics for departments and tests'

    def handle(self, *args, **kwargs):
        url = 'https://labaiddiagnostics.com/department-wise-test'
        self.stdout.write(f"Fetching departments from {url}...")
        
        try:
            res = requests.get(url)
            res.raise_for_status()
        except requests.exceptions.RequestException as e:
            self.stderr.write(f"Error fetching URL: {e}")
            return
            
        soup = BeautifulSoup(res.text, 'html.parser')
        
        links = soup.find_all('a', href=True)
        dept_urls = set()
        for a in links:
            if 'tests/' in a['href'] or 'item/type/' in a['href']:
                dept_urls.add(a['href'])
                
        self.stdout.write(f"Found {len(dept_urls)} department URLs.")
        
        for dept_url in dept_urls:
            dept_name = dept_url.split('/')[-1].replace('-', ' ').title()
            self.stdout.write(f"Scraping category: {dept_name}")
            
            category, created = TestCategory.objects.get_or_create(name=dept_name[:150])
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Created Category: {dept_name}"))
                
            try:
                dept_res = requests.get(dept_url)
                dept_res.raise_for_status()
            except requests.exceptions.RequestException as e:
                self.stderr.write(f"  Failed to fetch {dept_url}: {e}")
                continue
                
            dept_soup = BeautifulSoup(dept_res.text, 'html.parser')
            
            for h5 in dept_soup.find_all('h5'):
                test_name = h5.text.strip()
                if len(test_name) > 3 and not test_name.startswith('Email:') and not test_name.startswith('Hotline:'):
                    test_code = ""
                    if "(" in test_name and ")" in test_name:
                        try:
                            code_end = test_name.index(")")
                            test_code = test_name[1:code_end]
                            test_name = test_name[code_end+1:].strip()
                        except ValueError:
                            pass
                            
                    from django.utils.text import slugify
                    import uuid
                    from django.db import IntegrityError
                    
                    try:
                        test, t_created = Test.objects.get_or_create(
                            name=test_name[:200],
                            category=category,
                            defaults={'code': test_code[:50]}
                        )
                        if t_created:
                            self.stdout.write(self.style.SUCCESS(f"    Created Test: {test_name} (Code: {test_code})"))
                    except IntegrityError:
                        # Probably a duplicate slug for the same test name in another category, let's create with a unique slug
                        unique_slug = slugify(test_name[:200]) + "-" + str(uuid.uuid4())[:8]
                        test = Test.objects.create(
                            name=test_name[:200],
                            category=category,
                            code=test_code[:50],
                            slug=unique_slug
                        )
                        self.stdout.write(self.style.SUCCESS(f"    Created Test (unique slug): {test_name} (Code: {test_code})"))

        self.stdout.write(self.style.SUCCESS('Successfully scraped and injected departments and tests.'))
