ALLOWED = {
    'pending': ('confirmed', 'cancelled'),
    'confirmed': ('completed', 'cancelled', 'no_show'),
    'completed': (),
    'cancelled': (),
    'no_show': (),
}
