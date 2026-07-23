import { Injectable, Inject } from '@nestjs/common';
import { SeoValidator, SeoResult } from './seo-validator';
import { IAiProvider, FactCheckResult } from '../ai/interfaces/ai-provider.interface';
import { AiModule } from '../ai/ai.module';

@Injectable()
export class SeoService {
  private validator = new SeoValidator();

  constructor(@Inject(AiModule.providerToken) private aiProvider: IAiProvider) {}

  validateArticle(params: {
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
    targetWordCount?: number;
    hasSchemaJsonLd?: boolean;
    hasExpertAttribution?: boolean;
    hasProprietaryData?: boolean;
    hasFirstHandEvidence?: boolean;
    hasOriginalFramework?: boolean;
    hasFreshnessHook?: boolean;
  }): SeoResult {
    return this.validator.validate({
      title: params.title,
      content: params.content,
      metaTitle: params.metaTitle,
      metaDescription: params.metaDescription,
      keywords: params.keywords,
      targetWordCount: params.targetWordCount,
      hasSchemaJsonLd: params.hasSchemaJsonLd,
      hasExpertAttribution: params.hasExpertAttribution,
      hasProprietaryData: params.hasProprietaryData,
      hasFirstHandEvidence: params.hasFirstHandEvidence,
      hasOriginalFramework: params.hasOriginalFramework,
      hasFreshnessHook: params.hasFreshnessHook,
    });
  }

  async verifyClaims(content: string): Promise<FactCheckResult> {
    return this.aiProvider.verifyClaims(content);
  }
}
