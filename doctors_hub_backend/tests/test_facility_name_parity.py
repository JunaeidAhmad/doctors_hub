import pytest
from services.sms import format_facility_name_sms


def test_format_facility_name_sms_basic_and_blanks():
    assert format_facility_name_sms("Square Hospital", "Dhanmondi") == "Square Hospital (Dhanmondi)"
    assert format_facility_name_sms("Square Hospital", "") == "Square Hospital"
    assert format_facility_name_sms("Square Hospital", "   ") == "Square Hospital"
    assert format_facility_name_sms("Square Hospital", None) == "Square Hospital"
    assert format_facility_name_sms("", "Dhanmondi") == "(Dhanmondi)"
    assert format_facility_name_sms("", "") == ""
    assert format_facility_name_sms(None, None) == ""


def test_format_facility_name_sms_suffix_normalization():
    # Dash suffix
    assert format_facility_name_sms("Square Hospital - Dhanmondi", "Dhanmondi") == "Square Hospital (Dhanmondi)"

    # Comma suffix
    assert format_facility_name_sms("Square Hospital, Dhanmondi", "Dhanmondi") == "Square Hospital (Dhanmondi)"

    # Bare suffix
    assert format_facility_name_sms("Square Hospital Dhanmondi", "Dhanmondi") == "Square Hospital (Dhanmondi)"

    # Already formatted in parentheses
    assert format_facility_name_sms("Square Hospital (Dhanmondi)", "Dhanmondi") == "Square Hospital (Dhanmondi)"

    # Case-insensitive parentheses match
    assert format_facility_name_sms("Square Hospital (dhanmondi)", "Dhanmondi") == "Square Hospital (dhanmondi)"


def test_format_facility_name_sms_name_is_branch():
    assert format_facility_name_sms("Dhanmondi", "Dhanmondi") == "Dhanmondi"
    assert format_facility_name_sms("dhanmondi", "Dhanmondi") == "dhanmondi"
    assert format_facility_name_sms("Mirpur", "mirpur") == "Mirpur"


def test_format_facility_name_sms_whitespace_trimming():
    assert format_facility_name_sms("  Square Hospital  ", "  Dhanmondi  ") == "Square Hospital (Dhanmondi)"


def test_format_facility_name_sms_unicode_bengali():
    assert format_facility_name_sms("স্কয়ার হাসপাতাল", "ধানমন্ডি") == "স্কয়ার হাসপাতাল (ধানমন্ডি)"
    assert format_facility_name_sms("স্কয়ার হাসপাতাল - ধানমন্ডি", "ধানমন্ডি") == "স্কয়ার হাসপাতাল (ধানমন্ডি)"
    assert format_facility_name_sms("স্কয়ার হাসপাতাল (ধানমন্ডি)", "ধানমন্ডি") == "স্কয়ার হাসপাতাল (ধানমন্ডি)"
    assert format_facility_name_sms("ধানমন্ডি", "ধানমন্ডি") == "ধানমন্ডি"
