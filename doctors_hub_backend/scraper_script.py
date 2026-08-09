import requests
from bs4 import BeautifulSoup
import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import TestCategory, Test

def run():
    url = 'https://labaiddiagnostics.com/department-wise-test'
    res = requests.get(url)
    soup = BeautifulSoup(res.text, 'html.parser')

    links = soup.find_all('a', href=True)
    dept_urls = set()
    for a in links:
        if 'tests/' in a['href'] or 'item/type/' in a['href']:
            dept_urls.add(a['href'])

    print(f'Found {len(dept_urls)} department URLs.')

    for dept_url in list(dept_urls)[:3]:  # testing with 3
        dept_name = dept_url.split('/')[-1].replace('-', ' ').title()
        print(f"Scraping category: {dept_name} from {dept_url}")
        
        # Create Category
        category, created = TestCategory.objects.get_or_create(name=dept_name)
        if created:
            print(f"  Created Category: {dept_name}")

        dept_res = requests.get(dept_url)
        dept_soup = BeautifulSoup(dept_res.text, 'html.parser')
        
        for h5 in dept_soup.find_all('h5'):
            test_name = h5.text.strip()
            # Tests often look like "(B065) Cholinesterase, Serum" or just normal names
            # Let's filter out some non-test items like "Email: ...", etc.
            if len(test_name) > 3 and not test_name.startswith('Email:') and not test_name.startswith('Hotline:'):
                test_code = ""
                if "(" in test_name and ")" in test_name:
                    # Extract code like (B065)
                    try:
                        code_end = test_name.index(")")
                        test_code = test_name[1:code_end]
                        test_name = test_name[code_end+1:].strip()
                    except ValueError:
                        pass
                
                # Check for reference number in sibling/parent text if possible
                
                test, t_created = Test.objects.get_or_create(
                    name=test_name[:200], # max_length is 200
                    category=category,
                    defaults={'code': test_code[:50]}
                )
                if t_created:
                    print(f"    Created Test: {test_name}")

if __name__ == '__main__':
    run()
