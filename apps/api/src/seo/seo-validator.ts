export interface SeoResult {
  score: number;
  details: SeoDetail[];
  passed: boolean;
}

export interface SeoDetail {
  rule: string;
  passed: boolean;
  message: string;
}

interface SeoInput {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  content: string;
  keywords: string[];
}

export class SeoValidator {
  validate(input: SeoInput): SeoResult {
    const details: SeoDetail[] = [
      this.checkMetaTitle(input.metaTitle || input.title),
      this.checkMetaDescription(input.metaDescription),
      this.checkHeadingHierarchy(input.content),
      this.checkKeywordInTitle(input.metaTitle || input.title, input.keywords),
      this.checkKeywordInFirst300(input.content, input.keywords),
      this.checkKeywordInMetaDescription(input.metaDescription, input.keywords),
      this.checkKeywordInH2(input.content, input.keywords),
      this.checkWordCount(input.content),
    ];

    const passed = details.filter((d) => d.passed).length;
    const score = Math.round((passed / details.length) * 100);

    return { score, details, passed: score >= 70 };
  }

  private checkMetaTitle(title: string): SeoDetail {
    const len = title?.length || 0;
    return {
      rule: 'meta-title-length',
      passed: len >= 50 && len <= 60,
      message: len >= 50 && len <= 60
        ? `Meta title: ${len} caracteres (optimo 50-60)`
        : `Meta title: ${len} caracteres, debe ser entre 50 y 60`,
    };
  }

  private checkMetaDescription(desc?: string): SeoDetail {
    const len = desc?.length || 0;
    const isValid = len >= 150 && len <= 160;
    return {
      rule: 'meta-description-length',
      passed: isValid,
      message: isValid
        ? `Meta description: ${len} caracteres (optimo 150-160)`
        : desc
          ? `Meta description: ${len} caracteres, debe ser entre 150 y 160`
          : 'Meta description no definida',
    };
  }

  private checkHeadingHierarchy(content: string): SeoDetail {
    const h1s = content.match(/^#\s.+/gm) || [];
    const h2s = content.match(/^##\s.+/gm) || [];
    const hasH3 = /^###\s/.test(content);
    const hasH1 = h1s.length === 1 && !content.match(/^#{4,}\s/);
    const valid = h1s.length === 1 && h2s.length >= 1;

    return {
      rule: 'heading-hierarchy',
      passed: valid,
      message: valid
        ? `Jerarquia correcta: 1 H1, ${h2s.length} H2`
        : h1s.length === 0
          ? 'Falta H1'
          : h1s.length > 1
            ? `Demasiados H1: ${h1s.length}`
            : 'Faltan H2',
    };
  }

  private checkKeywordInTitle(title: string, keywords: string[]): SeoDetail {
    const titleLower = title?.toLowerCase() || '';
    const found = keywords.filter((k) => titleLower.includes(k.toLowerCase()));
    return {
      rule: 'keyword-in-title',
      passed: found.length > 0,
      message: found.length > 0
        ? `Keyword "${found[0]}" encontrada en el titulo`
        : 'Ninguna keyword principal esta en el titulo',
    };
  }

  private checkKeywordInFirst300(content: string, keywords: string[]): SeoDetail {
    const first300 = content.slice(0, 300).toLowerCase();
    const found = keywords.filter((k) => first300.includes(k.toLowerCase()));
    return {
      rule: 'keyword-in-first-300',
      passed: found.length > 0,
      message: found.length > 0
        ? `Keyword "${found[0]}" en primeros 300 caracteres`
        : 'Ninguna keyword aparece en los primeros 300 caracteres',
    };
  }

  private checkKeywordInMetaDescription(desc?: string, keywords?: string[]): SeoDetail {
    const descLower = desc?.toLowerCase() || '';
    const found = (keywords || []).filter((k) => descLower.includes(k.toLowerCase()));
    return {
      rule: 'keyword-in-meta-description',
      passed: found.length > 0,
      message: found.length > 0
        ? `Keyword "${found[0]}" en meta description`
        : 'Ninguna keyword en meta description',
    };
  }

  private checkKeywordInH2(content: string, keywords: string[]): SeoDetail {
    const h2s = content.match(/^##\s.+/gim) || [];
    const h2Text = h2s.join(' ').toLowerCase();
    const found = keywords.filter((k) => h2Text.includes(k.toLowerCase()));
    return {
      rule: 'keyword-in-h2',
      passed: found.length > 0,
      message: found.length > 0
        ? `Keyword "${found[0]}" encontrada en H2`
        : 'Ninguna keyword en headings H2',
    };
  }

  private checkWordCount(content: string): SeoDetail {
    const words = content?.trim() ? content.trim().split(/\s+/).length : 0;
    return {
      rule: 'min-word-count',
      passed: words >= 300,
      message: words >= 300
        ? `${words} palabras (minimo 300)`
        : `${words} palabras, minimo requerido: 300`,
    };
  }
}
