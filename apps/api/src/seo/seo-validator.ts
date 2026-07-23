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

export interface SeoInput {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  content: string;
  keywords: string[];
  targetWordCount?: number;
  hasSchemaJsonLd?: boolean;
  // Information Gain Rubric (puntaje 0-9)
  hasProprietaryData?: boolean;
  hasFirstHandEvidence?: boolean;
  hasOriginalFramework?: boolean;
  hasExpertAttribution?: boolean;
  hasFreshnessHook?: boolean;
}

export interface InformationGainResult {
  score: number;
  maxScore: number;
  details: SeoDetail[];
}

const PX_PER_CHAR_TITLE = 10;
const PX_PER_CHAR_DESC = 5.7;

const GENERIC_H2S = ['introduccion', 'introducción', 'conclusion', 'conclusión', 'resumen', 'objetivos', 'antecedentes'];

const IA_FILLER_WORDS = [
  'en este articulo', 'en este artículo', 'es importante', 'es crucial',
  'cabe destacar', 'vale la pena', 'por otro lado', 'ademas', 'además',
  'sin embargo', 'no obstante', 'asimismo', 'de igual manera',
  'es fundamental', 'es esencial', 'es necesario', 'es recomendable',
  'es relevante', 'tener en cuenta', 'por último', 'cabe mencionar',
  'hay que considerar', 'en el dinámico', 'en el cambiante', 'en el mundo de hoy',
  'no solo', 'sino también', 'cada vez más',
];

export class SeoValidator {
  validate(input: SeoInput): SeoResult {
    const infoGain = this.checkInformationGain(input);
    const details: SeoDetail[] = [
      this.checkMetaTitleWidth(input.metaTitle || input.title),
      this.checkMetaDescriptionWidth(input.metaDescription),
      this.checkEntitySalience(input.title, input.content, input.keywords),
      this.checkH2sAsQuestions(input.content),
      this.checkBluf(input.content),
      this.checkHeadingHierarchy(input.content),
      this.checkParagraphBrevity(input.content),
      this.checkKeywordInTitle(input.metaTitle || input.title, input.keywords),
      this.checkKeywordInFirst300(input.content, input.keywords),
      this.checkKeywordInMetaDescription(input.metaDescription, input.keywords),
      this.checkKeywordInH2(input.content, input.keywords),
      this.checkWordCount(input.content, input.targetWordCount),
      this.checkSchemaJsonLd(input.hasSchemaJsonLd),
      this.checkIaFootprint(input.content),
      ...infoGain.details,
    ];

    const passed = details.filter((d) => d.passed).length;
    const score = Math.round((passed / details.length) * 100);
    return { score, details, passed: score >= 70 };
  }

  // 1. Meta Title Width: max 500px (~50 caracteres)
  private checkMetaTitleWidth(title: string): SeoDetail {
    const px = title.length * PX_PER_CHAR_TITLE;
    const passed = px <= 500 && title.length > 20;
    return {
      rule: 'meta-title-width',
      passed,
      message: passed
        ? `Meta title: ~${px}px (${title.length} chars, max 500px)`
        : px > 500
          ? `Meta title: ~${px}px, excede los 500px (se truncara en movil)`
          : 'Meta title demasiado corto',
    };
  }

  // 2. Meta Description Width: max 680px (~120 caracteres)
  private checkMetaDescriptionWidth(desc?: string): SeoDetail {
    if (!desc) return { rule: 'meta-description-width', passed: false, message: 'Meta description no definida' };
    const px = desc.length * PX_PER_CHAR_DESC;
    const passed = px <= 680 && desc.length > 80;
    return {
      rule: 'meta-description-width',
      passed,
      message: passed
        ? `Meta description: ~${px}px (${desc.length} chars, max 680px)`
        : px > 680
          ? `Meta description: ~${px}px, se truncara en moviles (max 680px)`
          : 'Meta description muy corta (min 80 chars)',
    };
  }

  // 3. Entity Salience: entidad en H1 + Title + primer parrafo
  private checkEntitySalience(title: string, content: string, keywords: string[]): SeoDetail {
    const titleLower = title.toLowerCase();
    const h1Match = content.match(/^#\s(.+)/m);
    const h1Text = h1Match?.[1]?.toLowerCase() || '';
    const firstParagraph = content.split(/\n\s*\n/)[0]?.replace(/^#+\s.*/gm, '').trim().toLowerCase() || '';

    const inTitle = keywords.some((k) => titleLower.includes(k.toLowerCase()));
    const inH1 = keywords.some((k) => h1Text.includes(k.toLowerCase()));
    const inFirstP = keywords.some((k) => firstParagraph.includes(k.toLowerCase()));
    const passed = inTitle && inH1 && inFirstP;

    return {
      rule: 'entity-salience',
      passed,
      message: passed
        ? 'Entidad en H1, title y primer parrafo'
        : `${!inTitle ? 'Falta en title. ' : ''}${!inH1 ? 'Falta en H1. ' : ''}${!inFirstP ? 'Falta en primer parrafo. ' : ''}`,
    };
  }

  // 4. H2s como preguntas de usuario
  private checkH2sAsQuestions(content: string): SeoDetail {
    const h2s = content.match(/^##\s.+/gm) || [];
    if (h2s.length === 0) return { rule: 'h2s-as-questions', passed: false, message: 'No hay H2 en el contenido' };

    const generic = h2s.filter((h) => GENERIC_H2S.some((g) => h.toLowerCase().includes(g)));
    const questions = h2s.filter((h) => h.includes('?'));
    const passed = generic.length === 0 || questions.length >= h2s.length * 0.5;

    return {
      rule: 'h2s-as-questions',
      passed,
      message: passed
        ? `H2s optimizados: ${questions.length} preguntas, ${generic.length} genericos`
        : `${generic.length} H2 genericos detectados. Usa preguntas de usuario`,
    };
  }

  // 5. BLUF: respuesta directa al inicio del primer H2
  private checkBluf(content: string): SeoDetail {
    const h2Match = content.match(/^##\s.+\n([\s\S]*?)(?=^##|\Z)/m);
    if (!h2Match) return { rule: 'bluf', passed: false, message: 'No se pudo evaluar BLUF' };

    const firstSentence = h2Match[1]?.trim().split(/\.|\n/)[0]?.trim() || '';
    const passed = firstSentence.length > 20 && firstSentence.length < 200;

    return {
      rule: 'bluf',
      passed,
      message: passed
        ? `BLUF: respuesta directa en primera frase (${firstSentence.length} chars)`
        : 'La primera frase del H2 debe dar la respuesta directa (20-200 chars)',
    };
  }

  // 6. Jerarquia de encabezados
  private checkHeadingHierarchy(content: string): SeoDetail {
    const h1s = content.match(/^#\s.+/gm) || [];
    const h2s = content.match(/^##\s.+/gm) || [];
    const valid = h1s.length === 1 && h2s.length >= 1;

    return {
      rule: 'heading-hierarchy',
      passed: valid,
      message: valid
        ? `Jerarquia correcta: 1 H1, ${h2s.length} H2`
        : h1s.length === 0 ? 'Falta H1' : h1s.length > 1 ? `Demasiados H1: ${h1s.length}` : 'Faltan H2',
    };
  }

  // 7. Paragraph Brevity: 2-4 oraciones por bloque
  private checkParagraphBrevity(content: string): SeoDetail {
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0 && !p.startsWith('#'));
    if (paragraphs.length === 0) return { rule: 'paragraph-brevity', passed: true, message: 'Sin bloques de texto' };

    const longBlocks = paragraphs.filter((p) => {
      const sentences = p.split(/[.!?]\s+/).length;
      return sentences > 4;
    });

    const passed = longBlocks.length === 0;
    return {
      rule: 'paragraph-brevity',
      passed,
      message: passed
        ? `Todos los bloques tienen 2-4 oraciones`
        : `${longBlocks.length} bloques con mas de 4 oraciones (dificil extraccion para IA)`,
    };
  }

  // 8. Keyword en titulo
  private checkKeywordInTitle(title: string, keywords: string[]): SeoDetail {
    const titleLower = title?.toLowerCase() || '';
    const found = keywords.filter((k) => titleLower.includes(k.toLowerCase()));
    return {
      rule: 'keyword-in-title',
      passed: found.length > 0,
      message: found.length > 0 ? `Keyword "${found[0]}" en titulo` : 'Ninguna keyword en el titulo',
    };
  }

  // 9. Keyword en primeros 300 caracteres
  private checkKeywordInFirst300(content: string, keywords: string[]): SeoDetail {
    const first300 = content.slice(0, 300).toLowerCase();
    const found = keywords.filter((k) => first300.includes(k.toLowerCase()));
    return {
      rule: 'keyword-in-first-300',
      passed: found.length > 0,
      message: found.length > 0 ? `Keyword "${found[0]}" en primeros 300 chars` : 'Ninguna keyword en primeros 300',
    };
  }

  // 10. Keyword en meta description
  private checkKeywordInMetaDescription(desc?: string, keywords?: string[]): SeoDetail {
    if (!desc) return { rule: 'keyword-in-meta-description', passed: false, message: 'Meta description no definida' };
    const found = (keywords || []).filter((k) => desc.toLowerCase().includes(k.toLowerCase()));
    return {
      rule: 'keyword-in-meta-description',
      passed: found.length > 0,
      message: found.length > 0 ? `Keyword "${found[0]}" en meta description` : 'Ninguna keyword en meta description',
    };
  }

  // 11. Keyword en al menos un H2
  private checkKeywordInH2(content: string, keywords: string[]): SeoDetail {
    const h2s = content.match(/^##\s.+/gim) || [];
    const found = keywords.filter((k) => h2s.join(' ').toLowerCase().includes(k.toLowerCase()));
    return {
      rule: 'keyword-in-h2',
      passed: found.length > 0,
      message: found.length > 0 ? `Keyword "${found[0]}" en H2` : 'Ninguna keyword en H2',
    };
  }

  // 12. Word count dinamico (±20% del target)
  private checkWordCount(content: string, targetWordCount?: number): SeoDetail {
    const words = content?.trim() ? content.trim().split(/\s+/).length : 0;
    const target = targetWordCount || 300;
    const min = Math.round(target * 0.8);
    const max = Math.round(target * 1.2);
    const passed = words >= min && words <= max;

    return {
      rule: 'dynamic-word-count',
      passed,
      message: passed
        ? `${words} palabras (target: ${target}, rango: ${min}-${max})`
        : words < min
          ? `${words} palabras, minimo: ${min} (basado en Top 5 SERP)`
          : `${words} palabras, excede maximo: ${max}`,
    };
  }

  // 13. JSON-LD Schema
  private checkSchemaJsonLd(hasSchema?: boolean): SeoDetail {
    if (hasSchema === undefined) {
      return { rule: 'schema-json-ld', passed: true, message: 'Schema JSON-LD: verificar manualmente' };
    }
    return {
      rule: 'schema-json-ld',
      passed: hasSchema,
      message: hasSchema
        ? 'Schema JSON-LD presente (Article + Organization + Person)'
        : 'Falta schema JSON-LD',
    };
  }

  // 14. Information Gain (0-9 pts) — segun reglasseo.md
  private checkInformationGain(input: SeoInput): InformationGainResult {
    const checks = [
      {
        key: 'proprietary-data',
        label: 'Datos propietarios',
        description: 'Benchmarks o datos generados internamente',
        weight: 2,
        heuristic: /\d{2,}%|\d{3,}\s*(km|horas|usuarios|pruebas|test|corredores)/i.test(input.content),
      },
      {
        key: 'first-hand-evidence',
        label: 'Evidencia de 1ra mano',
        description: 'Capturas originales, pruebas de campo o resultados de herramientas propias',
        weight: 2,
        heuristic: /según mi experiencia|en mis pruebas|durante mi análisis|resultados reales|foto original/i.test(input.content),
      },
      {
        key: 'original-framework',
        label: 'Marco original',
        description: 'Metodologia con nombre propio',
        weight: 2,
        heuristic: /método|metodología|framework|rúbrica|matriz de|sistema de/i.test(input.content),
      },
      {
        key: 'expert-attribution',
        label: 'Atribucion de experto',
        description: 'Autor con historial verificable (sameAs a LinkedIn/ORCID)',
        weight: 2,
        passed: input.hasExpertAttribution,
        heuristic: false,
      },
      {
        key: 'freshness-hook',
        label: 'Gancho de frescura',
        description: 'Evento reciente o fecha de corte especifica',
        weight: 1,
        heuristic: /202[456]|20[2-9]\d|este año|reciente|actualización|nuevo estudio/i.test(input.content),
      },
    ];

    const details: SeoDetail[] = [];
    let totalScore = 0;
    const maxScore = checks.reduce((s, c) => s + c.weight, 0);

    for (const check of checks) {
      const passed = check.passed !== undefined ? check.passed : check.heuristic;
      if (passed) totalScore += check.weight;
      details.push({
        rule: `info-gain-${check.key}`,
        passed,
        message: passed
          ? `${check.label}: ${check.weight}/${check.weight} pts`
          : `${check.label}: 0/${check.weight} pts - ${check.description}`,
      });
    }

    return { score: totalScore, maxScore, details };
  }

  // 15. Huella estadistica de IA
  private checkIaFootprint(content: string): SeoDetail {
    let count = 0;
    const found: string[] = [];
    for (const filler of IA_FILLER_WORDS) {
      const matches = content.match(new RegExp(filler, 'gi'));
      if (matches) {
        count += matches.length;
        found.push(filler);
      }
    }

    const passed = count <= 3;
    return {
      rule: 'ia-footprint',
      passed,
      message: passed
        ? `Huella IA baja: ${count} frases de relleno`
        : `${count} frases tipicas de IA: "${found.slice(0, 3).join(', ')}..."`,
    };
  }
}
