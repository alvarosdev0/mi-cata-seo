export interface ArticleGenerationContext {
  productName: string;
  productDescription?: string;
  keywords: string[];
  tone?: string;
}

export interface GeneratedArticle {
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export abstract class IAiProvider {
  abstract generateArticle(context: ArticleGenerationContext): Promise<GeneratedArticle>;
}
