import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { IAiProvider, ArticleGenerationContext, GeneratedArticle } from '../interfaces/ai-provider.interface';

@Injectable()
export class DeepSeekProvider implements IAiProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY!,
    });
  }

  async generateArticle(context: ArticleGenerationContext): Promise<GeneratedArticle> {
    const prompt = this.buildPrompt(context);

    const response = await this.client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Eres un experto en SEO y redaccion de contenido. Genera articulos en Markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    return this.parseResponse(response.choices[0]?.message?.content || '');
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
    const title = raw.match(/TITULO:\s*(.+)/)?.[1] || contextFallback.title;
    const metaTitle = raw.match(/META_TITLE:\s*(.+)/)?.[1] || title;
    const metaDescription = raw.match(/META_DESCRIPTION:\s*(.+)/)?.[1] || '';
    const contentMatch = raw.match(/CONTENIDO:\s*([\s\S]*)/);
    const content = contentMatch?.[1]?.trim() || '';

    return { title, content, metaTitle, metaDescription, keywords: [] };
  }
}

const contextFallback = { title: 'Articulo Generado' };
