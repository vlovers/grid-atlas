"""Cross-collection checks for F1DB split JSON arrays; intentionally limited."""
def verify(collections):
    specs = [
        ("f1db-races", "year", "f1db-seasons", "year"),
        ("f1db-races", "circuitId", "f1db-circuits", "id"),
        ("f1db-races", "circuitLayoutId", "f1db-circuits-layouts", "id"),
        ("f1db-races", "grandPrixId", "f1db-grands-prix", "id"),
        ("f1db-seasons-entrants", "year", "f1db-seasons", "year"),
        ("f1db-seasons-entrants", "entrantId", "f1db-entrants", "id"),
        ("f1db-constructors-chronology", "constructorId", "f1db-constructors", "id"),
        ("f1db-constructors-chronology", "parentConstructorId", "f1db-constructors", "id"),
    ]
    checks, skipped = [], []
    for source, field, target, target_key in specs:
        if source not in collections or target not in collections:
            skipped.append({"source": source, "target": target, "reason": "missing collection"})
            continue
        known = {row[target_key] for row in collections[target]
                 if isinstance(row, dict) and row.get(target_key) is not None}
        missing = [row[field] for row in collections[source]
                   if isinstance(row, dict) and row.get(field) is not None
                   and row[field] not in known]
        checks.append({"source": source, "field": field, "target": target,
                       "orphan_count": len(missing), "examples": missing[:10]})
    years = sorted({r["year"] for r in collections.get("f1db-seasons", [])
                    if isinstance(r, dict) and isinstance(r.get("year"), int)})
    return {"checks": checks, "skipped": skipped,
            "season_coverage": {"first": years[0] if years else None,
                                "last": years[-1] if years else None,
                                "count": len(years),
                                "missing_years": [y for y in range(years[0], years[-1] + 1)
                                                  if y not in years] if years else []}}
