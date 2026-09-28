import sys
from django.core.management.base import BaseCommand
from django.db import transaction, connection
from django.utils.text import slugify
from facilities.models import Location, Hospital, DiagnosticCenter, Chamber, Thana, District
from doctors.models import DoctorAffiliation, AffiliationSchedule
from tests.models import FacilityTest
from bookings.models import DoctorBooking, TestBooking
from accounts.models import Role, UserRole


# ==============================================================================
# LOCAL DB MAPPINGS (for localhost:5432/doctors_hub)
# ==============================================================================
LOCAL_MERGE_MAPPING = [
    # 1. BSMMU / PG Hospital -> Bangabandhu Sheikh Mujib Medical University (BSMMU) (Shahbagh)
    {
        'canonical_id': '5552e309-3277-4770-a96e-e0dd196227f0',
        'cluster_name': 'BSMMU / PG Hospital',
        'duplicate_ids': [
            '1adba8b4-b982-475d-ae33-c359db34011a',  # BSMMU (Shahbag)
            'c173f2fb-7503-4be1-a6c2-cfa6c4a428a6',  # BSMMU (Dhaka)
            '7bd0717e-7d26-4da8-8bb4-6870f37aec95',  # BSMMU Hospital (Shahbagh Campus)
            '75983d55-f405-4d34-8641-0c0dcbbf7fac',  # Bangladesh Medical University (PG Hospital)
        ],
        'canonical_updates': {
            'name': 'Bangabandhu Sheikh Mujib Medical University (BSMMU)',
            'branch': 'Shahbagh',
            'thana_name': 'Shahbagh',
            'district_name': 'Dhaka',
            'address_line': 'Shahbagh, Dhaka-1000',
        }
    },
    # 2. BIRDEM General Hospital -> BIRDEM General Hospital (Shahbagh)
    {
        'canonical_id': 'e405aa2e-f919-40d3-9c16-f860cdb8c47d',
        'cluster_name': 'BIRDEM General Hospital',
        'duplicate_ids': [
            '83dd6745-05cd-4a0e-9180-706a47c02ba8',  # BIRDEM General Hospital (Dhaka)
            '7b508116-da09-47d7-bda9-2d48e06a7b31',  # BIRDEM Hospital (Dhaka)
        ],
        'canonical_updates': {
            'name': 'BIRDEM General Hospital',
            'branch': 'Shahbagh',
            'address_line': '122, Kazi Nazrul Islam Avenue, Shahbagh, Dhaka-1000',
            'thana_name': 'Shahbagh',
            'district_name': 'Dhaka',
        }
    },
    # 3. Dhaka Medical College Hospital -> DMCH Main Campus
    {
        'canonical_id': '8dbcb1b7-e146-4184-8ce4-8447455fd70e',
        'cluster_name': 'Dhaka Medical College Hospital',
        'duplicate_ids': [
            'd6bfec30-fd42-40c7-b486-f13eb8f27458',  # DMCH & Hospital
            'bcf5e50e-cf93-4a15-adb5-ef42a2f9429a',  # DMCH Main Campus
        ],
        'canonical_updates': {
            'name': 'Dhaka Medical College Hospital',
            'branch': 'Main Campus',
            'address_line': 'Secretariat Road, Ramna, Dhaka-1000',
            'phone': '+880 2-55165088',
            'thana_name': 'Ramna',
            'district_name': 'Dhaka',
        }
    },
    # 4. Ibn Sina Dhanmondi (House 48, Road 9/A only)
    {
        'canonical_id': '44384fcb-70f8-42f5-ab46-e98ec073e88a',
        'cluster_name': 'Ibn Sina Diagnostic (Road 9/A)',
        'duplicate_ids': [
            '36a36850-6fb9-5eb3-bf91-b5d58755a9fb',  # Ibn Sina Diagnostic Center (Dhanmondi Branch) (368 tests)
            '09fd6523-cef8-4f8d-b7a2-7dc30816a408',  # Ibn Sina Diagnostic & Consultation Center (5 docs)
            'a5e4949c-9ba0-402d-bf3b-173afea6a6bc',  # Ibn Sina Pain Rehab (1 doc)
        ],
        'canonical_updates': {
            'name': 'Ibn Sina Diagnostic & Imaging Center',
            'branch': 'Dhanmondi',
            'address_line': 'House # 48, Road # 9/A, Satmasjid Road, Dhanmondi, Dhaka-1209',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    },
    # 5. Ibn Sina Keraniganj -> Ibn Sina Hospital & Diagnostic Keraniganj Limited
    {
        'canonical_id': '284efd24-c2a9-4535-bb6b-bb2fc0bb28a5',
        'cluster_name': 'Ibn Sina Keraniganj',
        'duplicate_ids': [
            'ccce0a8b-7a0d-478c-8e5d-f530c494a109',  # Keranigonj Ltd.
        ],
        'canonical_updates': {
            'name': 'Ibn Sina Hospital & Diagnostic Keraniganj Limited',
            'branch': 'Keraniganj',
            'address_line': 'House # Ma Plaza, Kadamtali More, Islamabad, Jinjira, Keraniganj, Dhaka-1310',
            'thana_name': 'Keraniganj',
            'district_name': 'Dhaka',
        }
    },
    # 6. Japan Bangladesh Friendship Hospital -> JBFH (Dhanmondi)
    {
        'canonical_id': '8cb291b1-db7a-4b19-a208-07a3248da130',
        'cluster_name': 'Japan Bangladesh Friendship Hospital',
        'duplicate_ids': [
            'e1239968-f3e8-411e-a5c3-48c7bd001a6d',  # Zigatola
        ],
        'canonical_updates': {
            'name': 'Japan Bangladesh Friendship Hospital',
            'branch': 'Dhanmondi',
            'address_line': 'Plot # 55, Satmasjid Road, Zigatola Bus Stand, Dhanmondi, Dhaka-1209',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    },
    # 7. Medinova Dhanmondi -> Medinova Medical Services Ltd. (Dhanmondi)
    {
        'canonical_id': '10b4317e-434a-420f-9750-a450488818c4',
        'cluster_name': 'Medinova Dhanmondi',
        'duplicate_ids': [
            '9282df12-2323-414a-8d4c-d895b3e0b65c',  # Medinova Medical Services (8 docs)
            '231bab25-a3d7-524a-acf1-b757c61dedeb',  # Medinova Dhanmondi Main (210 tests)
            '635c4a35-8aa6-4fb5-9ec7-26c4938dbef6',  # Medinova Consultation Center (2 docs)
            '32a2a021-a92d-4f4e-83eb-6af5ad2521ba',  # Medinova Medical Services Limited (1 doc)
            '365e3484-15f1-44d7-8d52-43a0c6f39f36',  # Medinova 54/A Road 4/A (1 doc)
        ],
        'canonical_updates': {
            'name': 'Medinova Medical Services Ltd.',
            'branch': 'Dhanmondi',
            'address_line': 'House No. 71/A, Road No. 5/A, Dhanmondi R/A, Dhaka-1209',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    },
    # 8. NICVD -> National Institute of Cardiovascular Diseases
    {
        'canonical_id': '34d6de8f-08c8-4a55-bb7a-16a93be38929',
        'cluster_name': 'NICVD',
        'duplicate_ids': [
            'ea3f66b9-1d84-4913-983c-cf8bfd8a36ef',  # empty Sher-e-Bangla Nagar
        ],
        'canonical_updates': {
            'name': 'National Institute of Cardiovascular Diseases (NICVD)',
            'branch': 'Sher-e-Bangla Nagar',
            'address_line': 'Sher-e-Bangla Nagar, Dhaka-1207',
            'thana_name': 'Sher-e-Bangla Nagar',
            'district_name': 'Dhaka',
        }
    },
    # 9. NITOR -> National Institute of Traumatology and Orthopaedic Rehabilitation
    {
        'canonical_id': '7fe78b38-11d1-432f-8f51-e31a31d28c18',
        'cluster_name': 'NITOR',
        'duplicate_ids': [
            '9ab27e1e-acfc-41c7-8478-645d0609d2cc',  # empty Sher-e-Bangla Nagar
        ],
        'canonical_updates': {
            'name': 'National Institute of Traumatology and Orthopaedic Rehabilitation (NITOR)',
            'branch': 'Sher-e-Bangla Nagar',
            'address_line': 'Sher-e-Bangla Nagar, Dhaka-1207',
            'thana_name': 'Sher-e-Bangla Nagar',
            'district_name': 'Dhaka',
        }
    },
    # 10. Popular Diagnostic Centre Dhanmondi
    {
        'canonical_id': 'e4c14486-db00-40ef-b846-54486e036c7a',
        'cluster_name': 'Popular Diagnostic Centre Dhanmondi',
        'duplicate_ids': [
            'f48de611-d785-40b5-af35-9b6960fd626a',  # Popular Diagnostic Centre (9 docs)
            'f8bc43e6-fa15-4f65-bdf1-7f18ff7eae0d',  # Popular Diagnostic Centre Ltd., Dhaka (1 doc)
        ],
        'canonical_updates': {
            'name': 'Popular Diagnostic Centre Ltd.',
            'branch': 'Dhanmondi',
            'address_line': 'House 16, Road 2, Dhanmondi, Dhaka',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    },
    # 11. Popular Medical College Hospital Dhanmondi
    {
        'canonical_id': 'eb96da94-dfab-4fae-ae18-653d9254b46a',
        'cluster_name': 'Popular Medical College Hospital Dhanmondi',
        'duplicate_ids': [
            '991d14db-fb17-4dd4-b868-211feff63671',  # Popular Medical College Hospital, Dhaka (1 doc)
            '3a66d6f4-6d40-4fd9-9e03-12cfa0ff19c2',  # Popular Medical College Hospital Outdoor Building (1 doc)
        ],
        'canonical_updates': {
            'name': 'Popular Medical College Hospital',
            'branch': 'Dhanmondi',
            'address_line': 'House 16, Road 2, Dhanmondi, Dhaka',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    },
    # 12. Trauma Center & Orthopedic Hospital
    {
        'canonical_id': '80274153-7586-4029-9697-e7b054e98e13',
        'cluster_name': 'Trauma Center & Orthopedic Hospital',
        'duplicate_ids': [
            '563e6dfd-4375-4b2e-bab8-e9b84988b6cf',  # Shyamoli (3 docs)
        ],
        'canonical_updates': {
            'name': 'Trauma Center & Orthopedic Hospital (Pvt.) Ltd.',
            'branch': 'Mohammadpur',
            'address_line': '22/8/A, Mirpur Road, (Block-B, Babar Road), Opposite Mental Hospital, Mohammadpur, Dhaka-1207',
            'thana_name': 'Mohammadpur',
            'district_name': 'Dhaka',
        }
    },
    # 13. Anwer Khan Modern Fertility Center merged into Main Hospital
    {
        'canonical_id': '5fc675b9-f065-4415-aa4e-f4a367e199d2',
        'cluster_name': 'Anwer Khan Modern Medical College Hospital',
        'duplicate_ids': [
            'fd5b5fd3-0f13-4e78-8d3f-452289b97027',  # Fertility Center (1 doc)
        ],
        'canonical_updates': {
            'name': 'Anwer Khan Modern Medical College Hospital',
            'branch': 'Dhanmondi',
            'address_line': 'House-17, Road-8, Dhanmondi, Dhaka-1205',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    }
]

LOCAL_SEPARATE_UPDATES = [
    {
        'id': '5943e135-56a2-4983-bee8-f24214ef6475',
        'name': 'Ibn Sina Medical Imaging Center',
        'branch': 'Zigatola / Road 2/A',
        'address_line': 'House 58, Road 2/A, Dhanmondi R/A, Dhaka-1209',
        'thana_name': 'Dhanmondi',
        'district_name': 'Dhaka',
    },
    {
        'id': 'd935b84a-331f-4b99-a8d1-0eff6921ee98',
        'name': 'Anwer Khan Modern Cardiac Centre',
        'branch': 'Dhanmondi - Road 8',
        'address_line': 'Block-F, House-20, Road-8, Dhanmondi, Dhaka-1205',
        'thana_name': 'Dhanmondi',
        'district_name': 'Dhaka',
    },
    {
        'id': '39d32bab-b497-416a-80c7-541053af81c3',  # Alliance Hospital Limited
        'thana_name': 'Mirpur',
        'district_name': 'Dhaka',
    },
    {
        'id': 'e91a2767-1fb2-4b58-986a-50afb47ca4b9',  # Delta Medical College Hospital
        'thana_name': 'Mirpur',
        'district_name': 'Dhaka',
    },
    {
        'id': '3fc56fec-10c1-4e51-8ff2-d9a24791a5c1',  # Shaheed Suhrawardy Medical College & Hospital
        'thana_name': 'Sher-e-Bangla Nagar',
        'district_name': 'Dhaka',
    },
    {
        'id': 'ab0f71c6-dc81-4431-bd30-cc1c270ed0f3',  # Bangladesh Medical College Hospital
        'thana_name': 'Dhanmondi',
        'district_name': 'Dhaka',
    },
    {
        'id': '9ca992c6-d7e7-414a-94b5-6b7aecbdcf22',  # Z H Sikder Women's Medical College Hospital
        'thana_name': 'Dhanmondi',
        'district_name': 'Dhaka',
    },
    {
        'id': '04c3f637-f3f0-484e-ad83-49cde3ad2812',  # Armed Forces Medical College
        'thana_name': 'Cantonment',
        'district_name': 'Dhaka',
    },
]


# ==============================================================================
# NEON DB MAPPINGS (for Neon remote PostgreSQL)
# ==============================================================================
NEON_MERGE_MAPPING = [
    # 1. BSMMU / PG Hospital -> Bangabandhu Sheikh Mujib Medical University (BSMMU) (Shahbagh)
    {
        'canonical_id': '8f086372-6c82-41c0-901e-9b125b6779f4',
        'cluster_name': 'BSMMU / PG Hospital',
        'duplicate_ids': [
            '51c9930a-19f7-4db1-9c51-010f30e381e7',  # Shahbag
            '4de06830-92a5-4958-9272-eeb406c2437c',  # Dhaka
            '739a2606-a9f7-4051-b35b-bffca8aea8ef',  # PG Hospital
            '7bd0717e-7d26-4da8-8bb4-6870f37aec95',  # BSMMU Hospital
        ],
        'canonical_updates': {
            'name': 'Bangabandhu Sheikh Mujib Medical University (BSMMU)',
            'branch': 'Shahbagh',
            'thana_name': 'Shahbagh',
            'district_name': 'Dhaka',
            'address_line': 'Shahbagh, Dhaka-1000',
        }
    },
    # 2. BIRDEM General Hospital -> BIRDEM General Hospital (Shahbagh)
    {
        'canonical_id': 'b5f650df-15dc-4ed0-8a62-d4fbdfbdfff0',
        'cluster_name': 'BIRDEM General Hospital',
        'duplicate_ids': [
            'f403a44e-a340-4527-ba84-ef66bf925cc4',  # Shahbag
            '1ec33cc5-90e9-4271-919f-adc26ef492ab',  # BIRDEM Hospital
        ],
        'canonical_updates': {
            'name': 'BIRDEM General Hospital',
            'branch': 'Shahbagh',
            'address_line': '122, Kazi Nazrul Islam Avenue, Shahbagh, Dhaka-1000',
            'thana_name': 'Shahbagh',
            'district_name': 'Dhaka',
        }
    },
    # 3. Dhaka Medical College Hospital -> DMCH Main Campus
    {
        'canonical_id': 'bcf5e50e-cf93-4a15-adb5-ef42a2f9429a',
        'cluster_name': 'Dhaka Medical College Hospital',
        'duplicate_ids': [
            '7900c240-9d8b-4b83-91f4-242e7c92d78a',  # DMCH & Hospital
        ],
        'canonical_updates': {
            'name': 'Dhaka Medical College Hospital',
            'branch': 'Main Campus',
            'address_line': 'Secretariat Road, Ramna, Dhaka-1000',
            'phone': '+880 2-55165088',
            'thana_name': 'Ramna',
            'district_name': 'Dhaka',
        }
    },
    # 4. Ibn Sina Dhanmondi (House 48, Road 9/A only)
    {
        'canonical_id': '77b0d35a-2816-4b26-889d-86035d811737',
        'cluster_name': 'Ibn Sina Diagnostic (Road 9/A)',
        'duplicate_ids': [
            '36a36850-6fb9-5eb3-bf91-b5d58755a9fb',  # Ibn Sina Diagnostic Center (368 tests)
            'bfdf6144-aaef-4032-8431-aee4aed622e7',  # Ibn Sina Diagnostic & Consultation Center (5 docs)
            '5ab0fde1-5491-4b7f-93ad-0216637526d5',  # Ibn Sina Pain Rehab (1 doc)
        ],
        'canonical_updates': {
            'name': 'Ibn Sina Diagnostic & Imaging Center',
            'branch': 'Dhanmondi',
            'address_line': 'House # 48, Road # 9/A, Satmasjid Road, Dhanmondi, Dhaka-1209',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    },
    # 5. Ibn Sina Keraniganj -> Ibn Sina Hospital & Diagnostic Keraniganj Limited
    {
        'canonical_id': 'da82beb5-d983-4cc6-ae2c-d0c5c0fa3fdf',
        'cluster_name': 'Ibn Sina Keraniganj',
        'duplicate_ids': [
            '650c1548-8835-4e5b-95fa-f492cb9c5637',  # Keranigonj Ltd.
        ],
        'canonical_updates': {
            'name': 'Ibn Sina Hospital & Diagnostic Keraniganj Limited',
            'branch': 'Keraniganj',
            'address_line': 'House # Ma Plaza, Kadamtali More, Islamabad, Jinjira, Keraniganj, Dhaka-1310',
            'thana_name': 'Keraniganj',
            'district_name': 'Dhaka',
        }
    },
    # 6. Japan Bangladesh Friendship Hospital -> JBFH (Dhanmondi)
    {
        'canonical_id': '7e81cf7d-a76f-4ff4-8a2f-c74c174467c6',
        'cluster_name': 'Japan Bangladesh Friendship Hospital',
        'duplicate_ids': [
            '13932fe8-6f04-4ff3-b48d-8cc81f80b9c2',  # Zigatola
        ],
        'canonical_updates': {
            'name': 'Japan Bangladesh Friendship Hospital',
            'branch': 'Dhanmondi',
            'address_line': 'Plot # 55, Satmasjid Road, Zigatola Bus Stand, Dhanmondi, Dhaka-1209',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    },
    # 7. Medinova Dhanmondi -> Medinova Medical Services Ltd. (Dhanmondi)
    {
        'canonical_id': '1ea9e081-f9c6-44c9-9230-9bf2dee1c987',
        'cluster_name': 'Medinova Dhanmondi',
        'duplicate_ids': [
            '231bab25-a3d7-524a-acf1-b757c61dedeb',  # Medinova Medical Services (8 docs, 210 tests)
            'ea205e2b-0943-4975-b8ed-f1aad449bd7d',  # Medinova Consultation Center (2 docs)
            '08b9798a-69c3-42ca-8a6c-3398bb0dd388',  # Medinova Medical Services Limited (1 doc)
            '60ebe322-86eb-4079-abbc-5d1a089c2fc1',  # Medinova (1 doc)
        ],
        'canonical_updates': {
            'name': 'Medinova Medical Services Ltd.',
            'branch': 'Dhanmondi',
            'address_line': 'House No. 71/A, Road No. 5/A, Dhanmondi R/A, Dhaka-1209',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    },
    # 8. NICVD -> National Institute of Cardiovascular Diseases
    {
        'canonical_id': 'c6aae60b-121e-4ba2-afaf-cc138c18d8b0',
        'cluster_name': 'NICVD',
        'duplicate_ids': [
            'ea3f66b9-1d84-4913-983c-cf8bfd8a36ef',  # empty Sher-e-Bangla Nagar
        ],
        'canonical_updates': {
            'name': 'National Institute of Cardiovascular Diseases (NICVD)',
            'branch': 'Sher-e-Bangla Nagar',
            'address_line': 'Sher-e-Bangla Nagar, Dhaka-1207',
            'thana_name': 'Sher-e-Bangla Nagar',
            'district_name': 'Dhaka',
        }
    },
    # 9. NITOR -> National Institute of Traumatology and Orthopaedic Rehabilitation
    {
        'canonical_id': 'bc148bc0-c358-4ff3-b199-1bdd8ef0e705',
        'cluster_name': 'NITOR',
        'duplicate_ids': [
            '9ab27e1e-acfc-41c7-8478-645d0609d2cc',  # empty Sher-e-Bangla Nagar
        ],
        'canonical_updates': {
            'name': 'National Institute of Traumatology and Orthopaedic Rehabilitation (NITOR)',
            'branch': 'Sher-e-Bangla Nagar',
            'address_line': 'Sher-e-Bangla Nagar, Dhaka-1207',
            'thana_name': 'Sher-e-Bangla Nagar',
            'district_name': 'Dhaka',
        }
    },
    # 10. Popular Diagnostic Centre Dhanmondi
    {
        'canonical_id': 'e4c14486-db00-40ef-b846-54486e036c7a',
        'cluster_name': 'Popular Diagnostic Centre Dhanmondi',
        'duplicate_ids': [
            'e6a167f5-ae88-4e76-aee5-bcd4d5b529b2',  # Popular Diagnostic Centre (9 docs)
            'f2f71982-a41a-46dc-9201-23df7b59acee',  # Popular Diagnostic Centre Ltd., Dhaka (1 doc)
        ],
        'canonical_updates': {
            'name': 'Popular Diagnostic Centre Ltd.',
            'branch': 'Dhanmondi',
            'address_line': 'House 16, Road 2, Dhanmondi, Dhaka',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    },
    # 11. Popular Medical College Hospital Dhanmondi
    {
        'canonical_id': 'c9a81798-511f-4c86-b87c-dc76ee8ce8c8',
        'cluster_name': 'Popular Medical College Hospital Dhanmondi',
        'duplicate_ids': [
            '3c1c5d9f-e543-4863-a9c5-0ebb0ef32de0',  # Popular Medical College Hospital, Dhaka (1 doc)
            'd9ba2cb4-4259-41f0-b136-2dc25337a40e',  # Popular Medical College Hospital Outdoor Building (1 doc)
        ],
        'canonical_updates': {
            'name': 'Popular Medical College Hospital',
            'branch': 'Dhanmondi',
            'address_line': 'House 16, Road 2, Dhanmondi, Dhaka',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    },
    # 12. Trauma Center & Orthopedic Hospital
    {
        'canonical_id': '577d7d65-8714-4a21-8ec6-0cae40b2e637',
        'cluster_name': 'Trauma Center & Orthopedic Hospital',
        'duplicate_ids': [
            '7633e9f8-b8f6-48a6-a757-eaeb8aecba18',  # Shyamoli (3 docs)
        ],
        'canonical_updates': {
            'name': 'Trauma Center & Orthopedic Hospital (Pvt.) Ltd.',
            'branch': 'Mohammadpur',
            'address_line': '22/8/A, Mirpur Road, (Block-B, Babar Road), Opposite Mental Hospital, Mohammadpur, Dhaka-1207',
            'thana_name': 'Mohammadpur',
            'district_name': 'Dhaka',
        }
    },
    # 13. Anwer Khan Modern Fertility Center merged into Main Hospital
    {
        'canonical_id': '4fb82092-3450-4c9f-bff9-fd49cb97df82',
        'cluster_name': 'Anwer Khan Modern Medical College Hospital',
        'duplicate_ids': [
            'aecfee18-4c70-4b67-b0e9-bd8b4e24d947',  # Fertility Center (1 doc)
        ],
        'canonical_updates': {
            'name': 'Anwer Khan Modern Medical College Hospital',
            'branch': 'Dhanmondi',
            'address_line': 'House-17, Road-8, Dhanmondi, Dhaka-1205',
            'thana_name': 'Dhanmondi',
            'district_name': 'Dhaka',
        }
    }
]

NEON_SEPARATE_UPDATES = [
    {
        'id': '81cd3496-e50e-4111-8a44-cd66e2ee08c1',
        'name': 'Ibn Sina Medical Imaging Center',
        'branch': 'Zigatola / Road 2/A',
        'address_line': 'House 58, Road 2/A, Dhanmondi R/A, Dhaka-1209',
        'thana_name': 'Dhanmondi',
        'district_name': 'Dhaka',
    },
    {
        'id': 'e4fb26af-6c92-4952-a5c0-e07da76d43ea',
        'name': 'Anwer Khan Modern Cardiac Centre',
        'branch': 'Dhanmondi - Road 8',
        'address_line': 'Block-F, House-20, Road-8, Dhanmondi, Dhaka-1205',
        'thana_name': 'Dhanmondi',
        'district_name': 'Dhaka',
    },
    {
        'id': '6693ba1b-ba58-4e28-b52e-b6fb5d0acb23',  # Alliance Hospital Limited
        'thana_name': 'Mirpur',
        'district_name': 'Dhaka',
    },
    {
        'id': '19b69802-8f16-415c-b3f8-d9a7715fa4d9',  # Delta Medical College Hospital
        'thana_name': 'Mirpur',
        'district_name': 'Dhaka',
    },
    {
        'id': '11a84c03-69f2-4b17-aa6e-6043196d5d8e',  # Shaheed Suhrawardy Medical College & Hospital
        'thana_name': 'Sher-e-Bangla Nagar',
        'district_name': 'Dhaka',
    },
    {
        'id': '65f27bd9-9907-4514-a6a4-5b6eee0ca592',  # Bangladesh Medical College Hospital
        'thana_name': 'Dhanmondi',
        'district_name': 'Dhaka',
    },
    {
        'id': '881d2ef4-ff6d-4b4a-af49-d6861da34032',  # Z H Sikder Women's Medical College Hospital
        'thana_name': 'Dhanmondi',
        'district_name': 'Dhaka',
    },
    {
        'id': 'd55aa52f-d4a0-495d-acbf-5f0406e7698e',  # Armed Forces Medical College
        'thana_name': 'Cantonment',
        'district_name': 'Dhaka',
    },
]

# Normalizing branch labels and stripping trailing spaces on test facilities
TEST_FACILITY_BRANCH_UPDATES = [
    {'id': 'cb60964f-207b-5428-aa4f-1acef5b025c7', 'branch': 'Banani Branch'},
    {'id': '26f9ea2a-7729-5018-8f85-4b0c6474a997', 'branch': 'Shahbagh Central'},
    {'id': 'a2322346-16d0-5597-82bf-efb68d5669aa', 'branch': 'Shyamoli Branch'},
    {'id': '9b1fd747-4e0f-5fc2-9bef-e68c8ad1ec8a', 'branch': 'Dhaka Branch'},
    {'id': 'a3493060-fdb0-521a-8b91-5b19137d6a75', 'branch': 'Chittagong Central'},
    {'id': 'df582c29-425f-5eb1-9b4c-2bfa84fac869', 'branch': 'Gulshan Branch'},
    {'id': '65891da5-e53f-515f-9a10-db732edf6321', 'branch': 'Mirpur Branch'},
    {'id': '4cf9a060-f377-59f7-98e9-3bf0c1ffe27d', 'branch': 'Bakshibazar Main'},
    {'id': '8c16be1f-e2ea-4a71-a1e6-be5aee82abcb', 'branch': 'Mohakhali Campus'},
    {'id': '26c182c7-2c7e-5615-9a1d-f0ec102d66ea', 'branch': 'Uttara Branch'},
    {'id': '42e93c99-d8db-5d1f-b8af-59838b290646', 'branch': 'Panthapath Main'},
    {'id': '5c191ada-c7ef-5aa9-9269-4b79d1dafbed', 'branch': 'Panchlaish Branch'},
    {'id': '6c497605-22d9-420e-a5b8-bee954c50539', 'branch': 'Main Campus'},
    {'id': 'fb4b4da0-4301-50d6-90da-72d0fb239eaa', 'branch': 'Dhanmondi Branch'},
]


class Command(BaseCommand):
    help = "Deduplicates facilities, repoints doctor affiliations, schedules, tests, and bookings."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate operations without writing changes to the database.',
        )
        parser.add_argument(
            '--target',
            type=str,
            choices=['auto', 'local', 'neon'],
            default='auto',
            help='Target database environment (auto, local, or neon).',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        target = options['target']

        host = connection.settings_dict.get('HOST', '')
        dbname = connection.settings_dict.get('NAME', '')

        # Auto-detect target environment
        if target == 'auto':
            if 'neon' in host.lower() or Location.objects.filter(id='8f086372-6c82-41c0-901e-9b125b6779f4').exists():
                active_target = 'neon'
            else:
                active_target = 'local'
        else:
            active_target = target

        self.stdout.write(self.style.NOTICE(f"=== CONNECTED TO DATABASE: {dbname} on {host} (Target: {active_target.upper()}) ==="))

        if dry_run:
            self.stdout.write(self.style.WARNING("=== RUNNING IN DRY-RUN MODE (No changes will be saved) ==="))
        else:
            self.stdout.write(self.style.SUCCESS("=== RUNNING IN LIVE MIGRATION MODE ==="))

        if active_target == 'neon':
            merge_mapping = NEON_MERGE_MAPPING
            separate_updates = NEON_SEPARATE_UPDATES
            apply_test_facility_branches = True
        else:
            merge_mapping = LOCAL_MERGE_MAPPING
            separate_updates = LOCAL_SEPARATE_UPDATES
            apply_test_facility_branches = False

        with transaction.atomic():
            total_affiliations_repointed = 0
            total_affiliations_merged = 0
            total_schedules_transferred = 0
            total_schedules_deleted_duplicate = 0
            total_tests_transferred = 0
            total_tests_deleted_duplicate = 0
            total_locations_deleted = 0

            # 1. Process each cluster
            for c_idx, cluster in enumerate(merge_mapping, 1):
                cname = cluster['cluster_name']
                cid = cluster['canonical_id']
                dup_ids = cluster['duplicate_ids']

                try:
                    canonical_loc = Location.objects.get(id=cid)
                except Location.DoesNotExist:
                    self.stderr.write(self.style.ERROR(f"Canonical location not found: {cid} for {cname}"))
                    continue

                self.stdout.write(f"\n[{c_idx}/{len(merge_mapping)}] Processing Cluster: {cname} -> Canonical: {canonical_loc.name} ({canonical_loc.id})")

                for did in dup_ids:
                    try:
                        dup_loc = Location.objects.get(id=did)
                    except Location.DoesNotExist:
                        self.stdout.write(f"  Duplicate {did} already deleted or does not exist, skipping.")
                        continue

                    self.stdout.write(f"  Merging duplicate: {dup_loc.name} ({dup_loc.branch}) [{dup_loc.id}]")

                    # A. Repoint / Merge Doctor Affiliations
                    dup_affiliations = list(DoctorAffiliation.objects.filter(location=dup_loc).select_related('doctor'))
                    for aff in dup_affiliations:
                        doc = aff.doctor
                        # Check if doctor already has an affiliation at canonical location
                        canon_aff = DoctorAffiliation.objects.filter(location=canonical_loc, doctor=doc).first()
                        if not canon_aff:
                            # Simple repoint
                            aff.location = canonical_loc
                            aff.save()
                            total_affiliations_repointed += 1
                            self.stdout.write(f"    - Repointed affiliation for Dr. {doc.name}")
                        else:
                            # Merge into existing canonical affiliation
                            total_affiliations_merged += 1
                            self.stdout.write(f"    - Merging duplicate affiliation for Dr. {doc.name} into canonical affiliation ({canon_aff.id})")

                            # Repoint bookings
                            b_count = DoctorBooking.objects.filter(affiliation=aff).update(affiliation=canon_aff)
                            if b_count:
                                self.stdout.write(f"      Repointed {b_count} doctor bookings to canonical affiliation.")

                            # Repoint / deduplicate schedules
                            dup_schedules = list(aff.schedules.all())
                            for sched in dup_schedules:
                                # Check if identical schedule already on canonical
                                existing_sched = canon_aff.schedules.filter(
                                    day_of_week=sched.day_of_week,
                                    start_time=sched.start_time,
                                    end_time=sched.end_time
                                ).first()
                                if existing_sched:
                                    sched.delete()
                                    total_schedules_deleted_duplicate += 1
                                else:
                                    # Check for conflict with other existing schedules
                                    conflict = canon_aff.schedules.filter(
                                        day_of_week=sched.day_of_week,
                                        start_time__lt=sched.end_time,
                                        end_time__gt=sched.start_time
                                    ).first()
                                    if conflict:
                                        self.stdout.write(self.style.WARNING(
                                            f"      Schedule overlap for Dr. {doc.name} on {sched.day_of_week} ({sched.start_time}-{sched.end_time}) with existing ({conflict.start_time}-{conflict.end_time}). Retaining existing."
                                        ))
                                        sched.delete()
                                        total_schedules_deleted_duplicate += 1
                                    else:
                                        sched.affiliation = canon_aff
                                        sched.save()
                                        total_schedules_transferred += 1

                            # Update fee if canonical had default 0 or 1000 and duplicate had specific fee
                            if canon_aff.fee == 1000 and aff.fee > 1000:
                                canon_aff.fee = aff.fee
                                canon_aff.save(update_fields=['fee'])

                            # Delete the redundant affiliation
                            aff.delete()

                    # B. Repoint / Merge Facility Tests
                    dup_tests = list(FacilityTest.objects.filter(location=dup_loc))
                    for ft in dup_tests:
                        canon_ft = FacilityTest.objects.filter(location=canonical_loc, test=ft.test).first()
                        if not canon_ft:
                            ft.location = canonical_loc
                            ft.save()
                            total_tests_transferred += 1
                        else:
                            # Transfer test bookings
                            TestBooking.objects.filter(facility_test=ft).update(facility_test=canon_ft)
                            ft.delete()
                            total_tests_deleted_duplicate += 1

                    # C. Repoint Roles & UserRoles
                    Role.objects.filter(owner_facility=dup_loc).update(owner_facility=canonical_loc)
                    for ur in UserRole.objects.filter(facility=dup_loc):
                        if UserRole.objects.filter(user=ur.user, role=ur.role, facility=canonical_loc).exists():
                            ur.delete()
                        else:
                            ur.facility = canonical_loc
                            ur.save()

                    # D. Delete Child Detail Records
                    Hospital.objects.filter(location=dup_loc).delete()
                    DiagnosticCenter.objects.filter(location=dup_loc).delete()
                    Chamber.objects.filter(location=dup_loc).delete()

                    # E. Delete duplicate Location
                    dup_loc.delete()
                    total_locations_deleted += 1
                    self.stdout.write(f"    - Deleted duplicate location {did}")

                # Update canonical location details
                updates = cluster.get('canonical_updates', {})
                if updates:
                    thana_name = updates.pop('thana_name', None)
                    district_name = updates.pop('district_name', None)
                    if thana_name:
                        t = Thana.objects.filter(name=thana_name, district__name=district_name or 'Dhaka').first()
                        if t:
                            canonical_loc.thana = t
                    for k, v in updates.items():
                        setattr(canonical_loc, k, v)
                    canonical_loc.save()
                    self.stdout.write(f"  Updated canonical location fields for {canonical_loc.name} ({canonical_loc.branch}).")

            # 2. Update separate verified facilities
            self.stdout.write("\n--- Normalizing Verified Separate Facilities & Legacy Thanas ---")
            for sep in separate_updates:
                sid = sep['id']
                loc = Location.objects.filter(id=sid).first()
                if not loc:
                    continue
                thana_name = sep.get('thana_name')
                dist_name = sep.get('district_name', 'Dhaka')
                if thana_name:
                    t = Thana.objects.filter(name=thana_name, district__name=dist_name).first()
                    if t:
                        loc.thana = t
                if 'name' in sep:
                    loc.name = sep['name']
                if 'branch' in sep:
                    loc.branch = sep['branch']
                if 'address_line' in sep:
                    loc.address_line = sep['address_line']
                loc.save()
                self.stdout.write(f"  Updated facility {loc.name} ({loc.branch}) [Thana: {loc.thana.name if loc.thana else ''}]")

            # 3. Clean test facility branch names if target is neon
            if apply_test_facility_branches:
                self.stdout.write("\n--- Normalizing Test Facility Branch Names & Stripping Trailing Spaces ---")
                for tf in TEST_FACILITY_BRANCH_UPDATES:
                    loc = Location.objects.filter(id=tf['id']).first()
                    if loc:
                        loc.branch = tf['branch']
                        loc.save()
                        self.stdout.write(f"  Cleaned branch name for {loc.name} -> {loc.branch}")

            # Summary
            self.stdout.write("\n=== SUMMARY OF OPERATIONS ===")
            self.stdout.write(f"  Total Duplicate Locations Deleted: {total_locations_deleted}")
            self.stdout.write(f"  Doctor Affiliations Repointed:      {total_affiliations_repointed}")
            self.stdout.write(f"  Doctor Affiliations Merged:         {total_affiliations_merged}")
            self.stdout.write(f"  Doctor Schedules Transferred:       {total_schedules_transferred}")
            self.stdout.write(f"  Duplicate Schedules Cleaned:        {total_schedules_deleted_duplicate}")
            self.stdout.write(f"  Diagnostic Tests Transferred:       {total_tests_transferred}")
            self.stdout.write(f"  Duplicate Tests Cleaned:            {total_tests_deleted_duplicate}")

            loc_count = Location.objects.count()
            distinct_names = Location.objects.values('name').distinct().count()
            self.stdout.write(f"\n  Final Location Count:       {loc_count}")
            self.stdout.write(f"  Final Dropdown Facility Count: {distinct_names}")

            if dry_run:
                self.stdout.write(self.style.WARNING("\nDry-run complete. Rolling back transaction (No DB changes saved)."))
                transaction.set_rollback(True)
            else:
                self.stdout.write(self.style.SUCCESS("\nMigration committed successfully!"))
