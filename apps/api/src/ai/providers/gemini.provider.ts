import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider, ArticleGenerationContext, GeneratedArticle, FactCheckResult } from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements IAiProvider {
  private model: any;

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
  }

  async generateArticle(context: ArticleGenerationContext): Promise<GeneratedArticle> {
    const prompt = this.buildPrompt(context);
    const result = await this.model.generateContent(prompt);
    const text = result.response.text();
    return this.parseResponse(text);
  }

  private buildPrompt(context: ArticleGenerationContext): string {
    return `Eres un experto redactor SEO. Genera un articulo optimizado para estandares 2026.

Producto: "${context.productName}"
Descripcion: ${context.productDescription || 'N/A'}
Keywords objetivo: ${context.keywords.join(', ')}

REGLAS ESTRICTAS DE CALIDAD:
1. Titulo: MAXIMO 45 caracteres, sin asteriscos, sin comillas. La keyword principal debe estar al inicio.
2. Meta title: MAXIMO 45 caracteres, sin asteriscos ni marcas de formato.
3. Meta description: MAXIMO 110 caracteres, sin asteriscos ni marcas. Debe terminar la propuesta de valor antes de los 110.
4. Contenido: Minimo 600 palabras en Markdown. Usa 1 H1, H2 como preguntas (ej: "?Como funciona?"), H3 para detalles.
5. Distribucion: Keyword principal en titulo, primeros 300 caracteres, y al menos un H2.
6. INCLUYE una seccion de comparacion: menciona alternativas directas o competidores (ej: "vs Producto X").
7. INCLUYE una referencia temporal: menciona el año actual (2026) o datos actualizados.
8. INCLUYE datos especificos: numeros, estadisticas o metricas concretas sobre el producto.
9. Prohibido: NO uses **, *, _ ni ningun marcador de formato en title, metaTitle ni metaDescription.

Responde UNICAMENTE con este JSON, sin texto adicional, sin bloques de codigo:
{"title":"aqui el titulo sin asteriscos","metaTitle":"aqui el meta title sin asteriscos","metaDescription":"aqui la meta description sin asteriscos","content":"aqui el contenido completo en markdown"}`;
  }

  async verifyClaims(content: string): Promise<FactCheckResult> {
    const prompt = `Analiza este articulo y extrae afirmaciones que necesitan verificacion.

Clasifica cada afirmacion como:
- statistic: datos numericos o porcentajes
- date: fechas o eventos historicos
- attribution: citas o referencias a fuentes
- definition: conceptos presentados como hechos

Para cada afirmacion indica si es verificable o no y sugiere una fuente.

Formato (JSON):
{"claims":[{"statement":"...","type":"statistic","verified":false,"suggestion":"Buscar fuente en..."}]}

Articulo:
${content}


Responde SOLO con el JSON, sin explicaciones.`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());
    return { hasIssues: json.claims?.some((c: any) => !c.verified) || false, claims: json.claims || [] };
  }

  private parseResponse(raw: string): GeneratedArticle {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const json = JSON.parse(cleaned);
    return {
      title: json.title?.replace(/[*_]/g, '').trim() || 'Articulo Generado',
      content: json.content?.trim() || '',
      metaTitle: json.metaTitle?.replace(/[*_]/g, '').trim() || '',
      metaDescription: json.metaDescription?.replace(/[*_]/g, '').trim() || '',
      keywords: [],
    };
  }
}
