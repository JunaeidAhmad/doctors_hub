import os
import csv
import yaml
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from doctors.models import DoctorSpecialty, SpecialtyAlias
from doctors.services.taxonomy_rules import validate_node_parents
from doctors.services.specialty_resolver import normalize_text, detect_language


class Command(BaseCommand):
    help = "Load Taxonomy v3 from YAML file, preserving IDs, repointing legacy rows, and generating audit reports."

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='doctors/fixtures/taxonomy_v3.yaml',
            help='Path to taxonomy YAML file'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate execution and roll back changes'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        dry_run = options['dry_run']

        if not os.path.isabs(file_path):
            candidates = [
                Path.cwd() / file_path,
                Path(__file__).resolve().parent.parent.parent / file_path,
                Path('/home/ltl/Tomal/project_doctors_hub/doctors_hub_backend') / file_path,
            ]
            for c in candidates:
                if c.exists():
                    file_path = str(c)
                    break

        if not os.path.exists(file_path):
            raise CommandError(f"Taxonomy file not found: {file_path}")

        self.stdout.write(f"Loading taxonomy from {file_path} (dry_run={dry_run})...")

        with open(file_path, 'r', encoding='utf-8') as f:
            tax = yaml.safe_load(f)

        umbrellas_data = tax.get('umbrellas', [])
        leaves_data = tax.get('leaves', [])
        legacy_map = tax.get('legacy_map', {})

        self.stdout.write(f"YAML contains {len(umbrellas_data)} umbrellas, {len(leaves_data)} leaves, {len(legacy_map)} legacy map entries.")

        repo_dir = Path('/home/ltl/Tomal/project_doctors_hub')
        artifact_dir = repo_dir / '.agent' / 'specialty_repair'
        artifact_dir.mkdir(parents=True, exist_ok=True)

        mapping_report_path = artifact_dir / 'taxonomy_mapping_report.csv'
        tree_md_path = artifact_dir / 'taxonomy_tree.md'

        try:
            with transaction.atomic():
                self._execute_load(
                    umbrellas_data=umbrellas_data,
                    leaves_data=leaves_data,
                    legacy_map=legacy_map,
                    mapping_report_path=mapping_report_path,
                    tree_md_path=tree_md_path,
                    dry_run=dry_run
                )
                if dry_run:
                    self.stdout.write(self.style.WARNING("DRY-RUN mode enabled. Rolling back transaction."))
                    transaction.set_rollback(True)
                else:
                    self.stdout.write(self.style.SUCCESS("Taxonomy v3 loaded and committed successfully!"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error during taxonomy loading: {e}"))
            raise

    def _execute_load(self, umbrellas_data, leaves_data, legacy_map, mapping_report_path, tree_md_path, dry_run):
        existing_specialties = {s.id: s for s in DoctorSpecialty.objects.all()}
        assigned_existing_ids = set()

        node_objects = {}  # slug -> DoctorSpecialty
        umbrella_map = {}  # int id -> DoctorSpecialty
        report_rows = []

        # 1. Match and upsert Umbrellas
        self.stdout.write("Upserting umbrellas...")
        for u in umbrellas_data:
            slug = u['slug']
            name_l = u['name'].strip().lower()

            matched = None
            for sid, s in existing_specialties.items():
                if sid in assigned_existing_ids:
                    continue
                if s.slug == slug:
                    matched = s
                    break
            if not matched:
                for sid, s in existing_specialties.items():
                    if sid in assigned_existing_ids:
                        continue
                    if s.name.strip().lower() == name_l:
                        matched = s
                        break

            if matched:
                assigned_existing_ids.add(matched.id)
                old_slug = matched.slug
                old_name = matched.name
                action = 'keep' if (old_slug == slug and old_name == u['name']) else 'rename'
                obj = matched
            else:
                obj = DoctorSpecialty()
                old_slug = None
                old_name = None
                action = 'create'

            obj.name = u['name']
            obj.canonical_name = u['name']
            obj.bn_name = u.get('bn_name', '')
            obj.formal_name = u.get('formal_name', '')
            obj.slug = slug
            obj.icon = u.get('icon', 'Stethoscope')
            obj.is_umbrella = True
            obj.display_order = u.get('display_order', 0)
            obj.is_popular = u.get('is_popular', False)
            obj.save()


            node_objects[slug] = obj
            umbrella_map[u['id']] = obj

            report_rows.append({
                'old_row_id': str(obj.id) if action != 'create' else '',
                'old_name': old_name or '',
                'action': action,
                'target': slug,
                'doctors_affected': obj.doctors.count() if action != 'create' else 0,
                'slug': slug,
                'name': u['name'],
                'bn_name': u.get('bn_name', ''),
                'formal_name': u.get('formal_name', ''),
                'parents': '',
                'alias_count': 0,
                'legacy_slugs': old_slug if old_slug and old_slug != slug else '',
            })

        # 2. Match and upsert Leaves
        self.stdout.write("Upserting leaves...")
        for l in leaves_data:
            slug = l['slug']
            name_l = l['name'].strip().lower()
            formal_l = l.get('formal_name', '').strip().lower()
            formal_slug = slugify(l.get('formal_name', ''))

            matched = None
            # Priority 1: exact slug
            for sid, s in existing_specialties.items():
                if sid in assigned_existing_ids:
                    continue
                if s.slug == slug:
                    matched = s
                    break
            # Priority 2: exact name
            if not matched:
                for sid, s in existing_specialties.items():
                    if sid in assigned_existing_ids:
                        continue
                    if s.name.strip().lower() == name_l:
                        matched = s
                        break
            # Priority 3: formal name or formal slug
            if not matched and formal_l:
                for sid, s in existing_specialties.items():
                    if sid in assigned_existing_ids:
                        continue
                    if s.name.strip().lower() == formal_l or s.slug == formal_slug:
                        matched = s
                        break
            # Priority 4: legacy map match
            if not matched:
                for sid, s in existing_specialties.items():
                    if sid in assigned_existing_ids:
                        continue
                    t = legacy_map.get(s.slug) or legacy_map.get(s.name) or legacy_map.get(str(s.id))
                    if t == slug:
                        matched = s
                        break

            if matched:
                assigned_existing_ids.add(matched.id)
                old_slug = matched.slug
                old_name = matched.name
                action = 'keep' if (old_slug == slug and old_name == l['name']) else 'rename'
                obj = matched
            else:
                obj = DoctorSpecialty()
                old_slug = None
                old_name = None
                action = 'create'

            obj.name = l['name']
            obj.canonical_name = l['name']
            obj.bn_name = l.get('bn_name', '')
            obj.formal_name = l.get('formal_name', '')
            obj.slug = slug
            obj.icon = l.get('icon', 'Stethoscope')
            obj.is_umbrella = False
            obj.display_order = l.get('display_order', 0)
            obj.is_popular = l.get('is_popular', False)
            obj.save()

            node_objects[slug] = obj

            # Count declared aliases
            aliases_count = 1 + (1 if l.get('bn_name') else 0) + (1 if l.get('formal_name') else 0) + len(l.get('aliases_en', [])) + len(l.get('aliases_bn', []))

            report_rows.append({
                'old_row_id': str(obj.id) if action != 'create' else '',
                'old_name': old_name or '',
                'action': action,
                'target': slug,
                'doctors_affected': obj.doctors.count() if action != 'create' else 0,
                'slug': slug,
                'name': l['name'],
                'bn_name': l.get('bn_name', ''),
                'formal_name': l.get('formal_name', ''),
                'parents': ', '.join(str(p) for p in l.get('parents', [])),
                'alias_count': aliases_count,
                'legacy_slugs': old_slug if old_slug and old_slug != slug else '',
            })

        # 3. Handle remaining unassigned existing rows (turn them into Aliases)
        remaining_s_ids = set(existing_specialties.keys()) - assigned_existing_ids
        self.stdout.write(f"Retiring {len(remaining_s_ids)} legacy rows into aliases...")

        for sid in remaining_s_ids:
            s = existing_specialties[sid]
            target_slug = legacy_map.get(s.slug) or legacy_map.get(s.name) or legacy_map.get(str(s.id))
            if not target_slug or target_slug not in node_objects:
                raise CommandError(f"Legacy specialty {s.name} ({s.slug}, {s.id}) has no valid target leaf!")

            target = node_objects[target_slug]
            doctors_count = s.doctors.count()

            # Move doctors onto target and ensure primary_specialty
            for doc in s.doctors.all():
                target.doctors.add(doc)
                if not doc.primary_specialty:
                    doc.primary_specialty = target
                    doc.save(update_fields=['primary_specialty'])

            # Repoint existing aliases
            for alias in list(s.aliases.all()):
                dup = SpecialtyAlias.objects.filter(normalized=alias.normalized).exclude(id=alias.id).first()
                if dup:
                    alias.delete()
                else:
                    alias.specialty = target
                    alias.save()

            report_rows.append({
                'old_row_id': str(s.id),
                'old_name': s.name,
                'action': 'alias',
                'target': target_slug,
                'doctors_affected': doctors_count,
                'slug': '',
                'name': '',
                'bn_name': '',
                'formal_name': '',
                'parents': '',
                'alias_count': 0,
                'legacy_slugs': s.slug,
            })

            s.delete()

        # 4. Set Parents and Related links
        self.stdout.write("Setting parents and related links...")
        for l in leaves_data:
            leaf_obj = node_objects[l['slug']]
            parent_objs = [umbrella_map[pid] for pid in l.get('parents', []) if pid in umbrella_map]
            if not parent_objs:
                raise CommandError(f"Leaf '{leaf_obj.name}' ({leaf_obj.slug}) has no parent umbrellas in YAML!")
            leaf_obj.parent_categories.set(parent_objs)

            rel_nodes = []
            for rid in l.get('related', []):
                if isinstance(rid, int) and rid in umbrella_map:
                    rel_nodes.append(umbrella_map[rid])
                elif isinstance(rid, str) and rid in node_objects:
                    rel_nodes.append(node_objects[rid])
            if rel_nodes:
                leaf_obj.related.set(rel_nodes)

            # Validate constraints
            validate_node_parents(leaf_obj)

        for u in umbrellas_data:
            u_obj = node_objects[u['slug']]
            validate_node_parents(u_obj)


        # 6. Upsert verified aliases
        self.stdout.write("Upserting verified aliases...")
        for l in leaves_data:
            leaf_obj = node_objects[l['slug']]
            texts = [l['name']]
            if l.get('bn_name'):
                texts.append(l['bn_name'])
            if l.get('formal_name'):
                texts.append(l['formal_name'])
            texts.extend(l.get('aliases_en', []))
            texts.extend(l.get('aliases_bn', []))

            for t in texts:
                t = str(t).strip()
                if not t:
                    continue
                norm = normalize_text(t)
                if not norm:
                    continue
                lang = detect_language(t)
                SpecialtyAlias.objects.update_or_create(
                    normalized=norm,
                    defaults={
                        'specialty': leaf_obj,
                        'name': t,
                        'language': lang,
                        'is_verified': True,
                    }
                )

        # Also umbrellas
        for u in umbrellas_data:
            u_obj = node_objects[u['slug']]
            texts = [u['name']]
            if u.get('bn_name'):
                texts.append(u['bn_name'])
            if u.get('formal_name'):
                texts.append(u['formal_name'])
            for t in texts:
                t = str(t).strip()
                if not t:
                    continue
                norm = normalize_text(t)
                if not norm:
                    continue
                lang = detect_language(t)
                SpecialtyAlias.objects.update_or_create(
                    normalized=norm,
                    defaults={
                        'specialty': u_obj,
                        'name': t,
                        'language': lang,
                        'is_verified': True,
                    }
                )

        # 7. Write reports
        self.stdout.write("Writing taxonomy mapping report and tree markdown...")
        fieldnames = [
            'old_row_id', 'old_name', 'action', 'target', 'doctors_affected',
            'slug', 'name', 'bn_name', 'formal_name', 'parents',
            'alias_count', 'legacy_slugs'
        ]
        with open(mapping_report_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in report_rows:
                writer.writerow(r)

        # Build taxonomy tree
        with open(tree_md_path, 'w', encoding='utf-8') as f:
            f.write("# Doctor Specialty Taxonomy v3 Hierarchy\n\n")
            f.write(f"- **Umbrellas**: {len(umbrellas_data)}\n")
            f.write(f"- **Leaves**: {len(leaves_data)}\n")
            f.write(f"- **Aliases Count**: {SpecialtyAlias.objects.count()}\n")
            total_categorized = DoctorSpecialty.objects.filter(is_umbrella=False).values('doctors').distinct().count()
            f.write(f"- **Doctors Categorized**: {total_categorized}\n\n")
            f.write("---\n\n")

            for u in umbrellas_data:
                u_obj = node_objects[u['slug']]
                children = u_obj.subspecialties.all().order_by('display_order', 'name')
                child_doctor_ids = set()
                for c in children:
                    child_doctor_ids.update(c.doctors.values_list('id', flat=True))
                u_doc_count = len(child_doctor_ids)

                f.write(f"## {u['display_order']}. {u['name']} ({u.get('bn_name', '')}) — {u_doc_count} doctors\n")
                f.write(f"*Formal Name: {u.get('formal_name', '')}* | *Slug: `{u['slug']}`* | *Icon: `{u.get('icon', '')}`*\n\n")

                if not children.exists():
                    f.write("*(No child leaves)*\n\n")
                else:
                    for child in children:
                        doc_count = child.doctors.count()
                        alias_list = list(child.aliases.values_list('name', flat=True)[:8])
                        alias_str = ", ".join(alias_list)
                        if child.aliases.count() > 8:
                            alias_str += f" (+{child.aliases.count() - 8} more)"
                        f.write(f"- **{child.name}** / {child.bn_name} (`{child.slug}`) — {doc_count} doctors\n")
                        f.write(f"  - *Formal*: {child.formal_name}\n")
                        f.write(f"  - *Aliases*: {alias_str}\n")
                f.write("\n")
