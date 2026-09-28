import re

MBBS_PATTERN = re.compile(
    r'MBBS|M\.?B\.?B\.?S|এম\s*\.?\s*বি\s*\.?\s*বি\s*\.?\s*এস|'
    r'FCPS|এফসিপিএস|MCPS|এমসিপিএস|MD\b|এমডি|এম\s+ডি|MS\b|এমএস|এম\s+এস|'
    r'FRCP|এমআরসিপি|MRCP|FRCS|এফআরসিএস|MRCS|এমআরসিএস|'
    r'MRCOG|এমআরসিওজি|FRCOG|DCH|DLO|ডিএলও|DDV|ডিডিভি|'
    r'MCh|DM\b|FACP|MACP|FICS|FCPS|FCCP|PhD|Fellow',
    re.IGNORECASE
)
DENTAL_PATTERN = re.compile(r'BDS|B\.?D\.?S|বি\s*\.?\s*ডি\s*\.?\s*এস', re.IGNORECASE)
ALTERNATIVE_PATTERN = re.compile(r'DHMS|BHMS|Homoeo|Homeo|Unani|BUMS|Ayurved|BAMS|Acupunct|ডিএইচএমএস|বিএইচএমএস|হোমিও', re.IGNORECASE)
ALLIED_PATTERN = re.compile(r'Physio|BPT|MPT|Occupational|Nutrition|Dietet|Psycholog|M\.?Sc|B\.?Sc|MPH|ফিজিও|পুষ্টি|ডায়েট|এমএসসি|বিএসসি|ফুড', re.IGNORECASE)


def infer_provider_type(qualification_text, tags=None):
    """
    Infer provider_type ('physician', 'dental', 'allied', 'alternative', '')
    from qualification text and/or associated specialty tags.
    Returns (value, reason).
    """
    text = str(qualification_text or '')

    # 1. If text matches MBBS -> physician
    if MBBS_PATTERN.search(text):
        return ('physician', 'MBBS qualification detected')

    # 2. If text matches BDS -> dental
    if DENTAL_PATTERN.search(text):
        return ('dental', 'BDS qualification detected')

    # 3. If text matches alternative medicine degrees -> alternative
    if ALTERNATIVE_PATTERN.search(text):
        return ('alternative', 'Alternative medicine qualification detected')

    # 4. If text matches allied health degrees and no MBBS -> allied
    if ALLIED_PATTERN.search(text):
        return ('allied', 'Allied health qualification without MBBS detected')

    # 5. Otherwise -> the provider_type shared by all tags if they agree, else ''
    if tags:
        tag_types = set()
        for t in tags:
            pt = getattr(t, 'provider_type', '')
            if pt:
                tag_types.add(pt)
        if len(tag_types) == 1:
            shared_type = tag_types.pop()
            return (shared_type, f'Inferred from unanimous tag provider_type ({shared_type})')

    return ('', 'No matching qualification rule or unanimous tags')


def determine_provider_type(qualification_text, tags=None):
    """
    Returns just the provider_type string ('physician', 'dental', 'allied', 'alternative', '').
    """
    pt, _ = infer_provider_type(qualification_text, tags)
    return pt
