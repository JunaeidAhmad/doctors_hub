import os
import time
import uuid

_last_ms = 0
_last_counter = 0


def uuid7() -> uuid.UUID:
    """
    Generate an RFC 9562 compliant UUIDv7 with sub-millisecond monotonicity.
    - 48-bit Unix epoch millisecond timestamp (high bits)
    - 4-bit version (0x7)
    - 12-bit monotonic counter for sub-millisecond precision
    - 2-bit variant (0b10)
    - 62 bits of cryptographically secure randomness
    Strictly monotonic for optimal B-Tree index performance.
    """
    global _last_ms, _last_counter

    ns = time.time_ns()
    ms = ns // 1_000_000

    if ms > _last_ms:
        _last_ms = ms
        sub_ms = ((ns % 1_000_000) * 4096) // 1_000_000
        _last_counter = sub_ms & 0xFFF
    else:
        _last_counter = (_last_counter + 1) & 0xFFF
        if _last_counter == 0:
            _last_ms += 1
        ms = _last_ms

    rand_b = os.urandom(8)

    b = bytearray(16)
    b[0:6] = ms.to_bytes(6, byteorder='big')
    b[6] = 0x70 | ((_last_counter >> 8) & 0x0F)
    b[7] = _last_counter & 0xFF
    b[8] = 0x80 | (rand_b[0] & 0x3F)
    b[9:16] = rand_b[1:8]
    return uuid.UUID(bytes=bytes(b))

