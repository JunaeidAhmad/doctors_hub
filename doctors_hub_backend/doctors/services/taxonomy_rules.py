from django.core.exceptions import ValidationError
from django.db.models.signals import m2m_changed


def validate_node_parents(node):
    """
    Validate two-level taxonomy constraints for a node:
    - An umbrella must not have parents.
    - A leaf's parents must all be umbrellas.
    - A node cannot be its own parent.
    Raises ValidationError on violation.
    """
    if not node:
        return

    parents = list(node.parent_categories.all())
    if not parents:
        return

    if getattr(node, 'is_umbrella', False):
        raise ValidationError(
            f"Taxonomy violation: Umbrella '{node.name}' must not have parent categories."
        )

    for p in parents:
        if p.id == node.id:
            raise ValidationError(
                f"Taxonomy violation: Node '{node.name}' cannot be its own parent."
            )
        if not getattr(p, 'is_umbrella', False):
            raise ValidationError(
                f"Taxonomy violation: Parent '{p.name}' of node '{node.name}' must be an umbrella."
            )


def parent_categories_changed(sender, instance, action, **kwargs):
    if action == 'post_add':
        validate_node_parents(instance)


def connect_taxonomy_signals():
    try:
        from doctors.models import DoctorSpecialty
        m2m_changed.connect(parent_categories_changed, sender=DoctorSpecialty.parent_categories.through)
    except Exception:
        pass

connect_taxonomy_signals()
