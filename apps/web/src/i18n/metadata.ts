import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function localizedMetadata(title: string): Promise<Metadata> {
  const t = await getTranslations('UI');
  return { title: t(title), description: t('metadataDescription') };
}
