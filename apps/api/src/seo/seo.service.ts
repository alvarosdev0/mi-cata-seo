import { Injectable } from '@nestjs/common';
import { SeoValidator, SeoResult } from './seo-validator';

@Injectable()
export class SeoService {
  private validator = new SeoValidator();

  validateArticle(params: {
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  }): SeoResult {
    return this.validator.validate({
      title: params.title,
      content: params.content,
      metaTitle: params.metaTitle,
      metaDescription: params.metaDescription,
      keywords: params.keywords,
    });
  }
}
