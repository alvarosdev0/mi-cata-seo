import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider, ArticleGenerationContext, GeneratedArticle } from '../interfaces/ai-provider.interface';

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
    return `Genera un articulo SEO optimizado sobre "${context.productName}".

Descripcion: ${context.productDescription || 'N/A'}
Keywords: ${context.keywords.join(', ')}

El articulo debe incluir:
- Titulo atractivo (50-60 caracteres)
- Meta description (150-160 caracteres)
- Contenido en Markdown con H1, H2, H3
- Minimo 300 palabras
- Keyword principal en titulo, primeros 300 caracteres y al menos un H2
- Slug amigable

Formato esperado:
TITULO: ...
META_TITLE: ...
META_DESCRIPTION: ...
CONTENIDO:
...`;
  }

  private parseResponse(raw: string): GeneratedArticle {
    const title = raw.match(/TITULO:\s*(.+)/)?.[1] || 'Articulo Generado';
    const metaTitle = raw.match(/META_TITLE:\s*(.+)/)?.[1] || title;
    const metaDescription = raw.match(/META_DESCRIPTION:\s*(.+)/)?.[1] || '';
    const contentMatch = raw.match(/CONTENIDO:\s*([\s\S]*)/);
    const content = contentMatch?.[1]?.trim() || '';

    return { title, content, metaTitle, metaDescription, keywords: [] };
  }
}
