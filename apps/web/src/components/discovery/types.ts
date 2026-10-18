/** All text and number/date formatting belong to the caller's locale. */
export type ArchiveLink = Readonly<{ href: string; label: string }>;

export type RelatedEntityLink = ArchiveLink & Readonly<{
  /** Canonical entity kind + ID, independent of locale, label, and URL. */
  id: string;
}>;

export type Disclosure = Readonly<{
  label: string;
  text: string;
  /** Only pass a source link backed by the supplied record. */
  source?: ArchiveLink;
}>;

export type QuickFact = Readonly<{
  id: string;
  label: string;
  /** Use null for missing data; zero is a real value. */
  value: string | null;
  detail?: Disclosure;
}>;

export type DiscoveryItem = Readonly<{
  id: string;
  kind: string;
  title: string;
  summary: string;
  /** Explain why this item is connected to the current record. */
  relationship: string;
  destination: ArchiveLink;
  fact?: Readonly<{ label: string; value: string }>;
}>;

export type CareerEntry = Readonly<{
  id: string;
  /** A preformatted season, date range, or era. Never inferred here. */
  period: string;
  title: string;
  summary: string;
  destination?: ArchiveLink;
  detail?: Disclosure;
  /** Multiple canonical entities are allowed; repeated IDs retain the first link within this entry. */
  entities?: readonly RelatedEntityLink[];
}>;

export type RelatedJourney = Readonly<{
  /** Stable verified relation ID. Repeated IDs collapse; distinct relations remain. */
  id: string;
  kind: string;
  destination: ArchiveLink;
  /** Verified observation or reviewed editorial relation; never inferred from names. */
  relationship: string;
  context?: string;
}>;
