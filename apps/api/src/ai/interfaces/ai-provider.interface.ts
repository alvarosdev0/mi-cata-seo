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

export interface FactCheckResult {
  hasIssues: boolean;
  claims: FactCheckClaim[];
}

export interface FactCheckClaim {
  statement: string;
  type: 'statistic' | 'date' | 'attribution' | 'definition';
  verified: boolean;
  suggestion?: string;
}

export abstract class IAiProvider {
  abstract generateArticle(context: ArticleGenerationContext): Promise<GeneratedArticle>;
  abstract verifyClaims(content: string): Promise<FactCheckResult>;
}
