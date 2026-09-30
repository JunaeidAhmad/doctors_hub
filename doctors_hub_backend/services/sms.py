import json
import logging
import re
import urllib.parse
import urllib.request
from django.conf import settings

logger = logging.getLogger(__name__)


def normalize_bd_phone(phone: str) -> str:
    """
    Normalizes a Bangladesh phone number to 8801XXXXXXXXX or 01XXXXXXXXX format expected by SMS BD.
    """
    cleaned = ''.join(filter(str.isdigit, str(phone)))
    if cleaned.startswith('880'):
        return cleaned
    if cleaned.startswith('01'):
        return '88' + cleaned
    if cleaned.startswith('1') and len(cleaned) == 10:
        return '880' + cleaned
    return cleaned


def send_sms_via_sms_bd(phone: str, message: str) -> dict:
    """
    Dispatches SMS using sms.net.bd API endpoint.
    Endpoint: https://api.sms.net.bd/sendsms
    Required parameters: api_key, msg, to
    """
    api_url = getattr(settings, 'SMS_API_URL', 'https://api.sms.net.bd/sendsms')
    api_key = getattr(settings, 'SMS_API_KEY', 'wgVB8RM6vZ4h9W4F3Ba8u241z290PtJ2SYBc6hpY')
    sender_id = getattr(settings, 'SMS_SENDER_ID', '')

    formatted_phone = normalize_bd_phone(phone)

    payload = {
        'api_key': api_key,
        'msg': message,
        'to': formatted_phone,
    }
    if sender_id:
        payload['sender_id'] = sender_id

    try:
        data = urllib.parse.urlencode(payload).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=data,
            headers={
                'User-Agent': 'DoctorsHub-Backend/1.0',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            try:
                res_json = json.loads(res_body)
            except Exception:
                res_json = {"raw": res_body}
            
            logger.info(f"SMS BD API response for {formatted_phone}: {res_json}")
            
            # SMS BD returns error: 0 on success, and non-zero (like 421, 401, etc.) on failure
            err_code = res_json.get('error') if isinstance(res_json, dict) else None
            if err_code is not None and err_code != 0:
                err_msg = res_json.get('msg', 'SMS sending failed')
                logger.warning(f"SMS BD API rejected sending to {formatted_phone}: {err_msg} (code {err_code})")
                return {"success": False, "error": err_msg, "code": err_code, "response": res_json}

            return {"success": True, "response": res_json}
    except Exception as e:
        logger.error(f"Failed to send SMS to {formatted_phone} via SMS BD: {e}")
        return {"success": False, "error": str(e)}


from core.text import format_facility_name as format_facility_name_sms


def send_doctor_booking_confirmation_sms(booking) -> dict:
    """
    Sends an automated booking confirmation SMS for doctor appointments.
    """
    try:
        phone = booking.patient_phone or (booking.patient.phone if booking.patient else None)
        if not phone:
            return {"success": False, "error": "No phone number available"}

        patient_name = booking.patient_name or (booking.patient.name if booking.patient else "Patient")
        doctor_name = booking.affiliation.doctor.name if (booking.affiliation and booking.affiliation.doctor) else "Doctor"
        loc = booking.affiliation.location if booking.affiliation else None
        chamber_raw = loc.name if loc else "Chamber"
        chamber_branch = loc.branch if loc else ""
        chamber_name = format_facility_name_sms(chamber_raw, chamber_branch)
        serial = booking.serial_display or f"SL-{booking.serial_number or 1:03d}"
        date_str = str(booking.date)
        est_time_str = booking.estimated_time.strftime('%I:%M %p') if booking.estimated_time else ""
        time_info = f" (Est. Time: {est_time_str})" if est_time_str else ""

        message = (
            f"Dear {patient_name}, your appointment with {doctor_name} at {chamber_name} is CONFIRMED. "
            f"Serial No: {serial}. Date: {date_str}{time_info}. Thank you for choosing Doctors Hub."
        )
        return send_sms_via_sms_bd(phone, message)
    except Exception as e:
        logger.error(f"Error in send_doctor_booking_confirmation_sms: {e}")
        return {"success": False, "error": str(e)}


def send_test_booking_confirmation_sms(booking) -> dict:
    """
    Sends an automated booking confirmation SMS for diagnostic test bookings.
    """
    try:
        phone = booking.patient_phone or (booking.patient.phone if booking.patient else None)
        if not phone:
            return {"success": False, "error": "No phone number available"}

        patient_name = booking.patient_name or (booking.patient.name if booking.patient else "Patient")
        test_name = booking.facility_test.test.name if (booking.facility_test and booking.facility_test.test) else "Diagnostic Test"
        loc = booking.facility_test.location if booking.facility_test else None
        facility_raw = loc.name if loc else "Diagnostic Center"
        facility_branch = loc.branch if loc else ""
        facility_display = format_facility_name_sms(facility_raw, facility_branch)
        pickup_date = str(booking.pickup_date or "")
        ref_id = f"TESTBD-{booking.id}"

        message = (
            f"Dear {patient_name}, your diagnostic test booking for {test_name} at {facility_display} is CONFIRMED. "
            f"Ref: {ref_id}. Date: {pickup_date}. Thank you for choosing Doctors Hub."
        )
        return send_sms_via_sms_bd(phone, message)
    except Exception as e:
        logger.error(f"Error in send_test_booking_confirmation_sms: {e}")
        return {"success": False, "error": str(e)}


def send_hospital_service_booking_confirmation_sms(booking) -> dict:
    """
    Sends an automated booking confirmation SMS for hospital service bookings.
    """
    try:
        phone = booking.patient_phone or (booking.patient.phone if booking.patient else None)
        if not phone:
            return {"success": False, "error": "No phone number available"}

        patient_name = booking.patient_name or (booking.patient.name if booking.patient else "Patient")
        service_name = booking.service.name if booking.service else "Hospital Service"
        loc = booking.hospital.location if (booking.hospital and getattr(booking.hospital, 'location', None)) else None
        hospital_raw = loc.name if loc else getattr(booking.hospital, 'name', 'Hospital')
        hospital_branch = loc.branch if loc else getattr(booking.hospital, 'branch', '')
        hospital_display = format_facility_name_sms(hospital_raw, hospital_branch)
        booking_date = str(booking.booking_date or "")
        time_str = booking.preferred_time or ""
        time_info = f" ({time_str})" if time_str else ""
        ref_id = f"HSB-{booking.id}"

        message = (
            f"Dear {patient_name}, your hospital service request for {service_name} at {hospital_display} is CONFIRMED. "
            f"Ref: {ref_id}. Date: {booking_date}{time_info}. Thank you for choosing Doctors Hub."
        )
        return send_sms_via_sms_bd(phone, message)
    except Exception as e:
        logger.error(f"Error in send_hospital_service_booking_confirmation_sms: {e}")
        return {"success": False, "error": str(e)}
