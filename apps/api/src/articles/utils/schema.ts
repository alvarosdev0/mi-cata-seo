export function generateArticleJsonLd(params: {
  title: string;
  description?: string;
  content: string;
  slug: string;
  authorName: string;
  authorUrl?: string;
  organizationName: string;
  organizationUrl: string;
  datePublished?: Date;
  dateModified?: Date;
  imageUrl?: string;
}): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description || params.title,
    articleBody: params.content,
    author: {
      '@type': 'Person',
      name: params.authorName,
      ...(params.authorUrl ? { sameAs: params.authorUrl } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: params.organizationName,
      url: params.organizationUrl,
    },
    datePublished: params.datePublished?.toISOString() || new Date().toISOString(),
    dateModified: params.dateModified?.toISOString() || new Date().toISOString(),
    ...(params.imageUrl ? { image: params.imageUrl } : {}),
  };

  return JSON.stringify(schema, null, 2);
}
