import { GoogleGenAI, Type } from '@google/genai';
import { CefrLevelCode, GrammarTopic, LearningMode, QuestionItem } from '../types/gamify.ts';

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_BASE = `Sən GAMIFY platformasının AI İngilis Dili Müəllimi — "Nurdan Teacher"sən.
Azərbaycanlı şagirdlərə Abituriyent (DİM 2025 qəbul proqramı) və Aptis ESOL (CEFR A1–C1) imtahanlarına hazırlaşmaqda kömək edirsən.
Qaydalar:
1. İzahları aydın, qrammatik cəhətdən düzgün və səmimi Azərbaycan dilində ver, ingilis dili nümunələrini ingiliscə saxla.
2. Heç vaxt rəsmi British Council və ya DİM imtahan suallarını təqlid etdiyini/oğurladığını iddia etmə — yalnız tədris məqsədli izah və orijinal məşq nümunələri ver.
3. Şagirdi ruhlandır; səhv etdikdə cəzalandırıcı deyil, öyrədici tonla səbəbini və tipik Azərbaycanlı öyrənən tələsini izah et.
4. Cavabları qısa, strukturlu və oxunaqlı saxla.`;

export async function explainGrammarOrMistake(params: {
  topic?: GrammarTopic;
  questionText?: string;
  userAnswer?: string;
  correctAnswer?: string;
  cefrLevel: CefrLevelCode;
  mode: LearningMode;
  customPrompt?: string;
}): Promise<string> {
  const ai = getClient();
  const topicContext = params.topic
    ? `Mövzu: ${params.topic.title} (${params.topic.titleAz}) — ${params.topic.cefrLevel}
Təsdiqlənmiş Qayda: ${params.topic.explanationAz}
Tipik Xətalar: ${params.topic.commonMistakesAz.join(' | ')}`
    : '';

  const questionContext = params.questionText
    ? `Sual: "${params.questionText}"
Şagirdin cavabı: "${params.userAnswer || '-'}"
Düzgün cavab: "${params.correctAnswer || '-'}"`
    : '';

  const userPrompt = params.customPrompt
    ? `${topicContext}\n${questionContext}\nŞagirdin sualı (${params.mode}, səviyyə ${params.cefrLevel}): ${params.customPrompt}`
    : `${topicContext}\n${questionContext}\nZəhmət olmasa, şagirdin səhvinin və ya bu sualın qrammatik məntiqini ${params.cefrLevel} səviyyəsinə uyğun Azərbaycan dilində izah et, niyə səhv variantın uyğun olmadığını və DİM/Aptis tələsindən necə qorunmalı olduğunu göstər.`;

  if (!ai) {
    if (params.topic && params.questionText) {
      return `**Nurdan Teacher İzahı (${params.topic.title}):**\n\n${params.topic.explanationAz}\n\n${
        params.correctAnswer ? `✅ **Düzgün cavab:** ${params.correctAnswer}\n` : ''
      }${
        params.topic.commonMistakesAz[0]
          ? `⚠️ **Diqqət edilməli məqam:** ${params.topic.commonMistakesAz[0]}`
          : ''
      }`;
    }
    return `**Nurdan Teacher Məsləhəti (${params.cefrLevel}):**\n\nBu bölmədə əsas diqqəti zaman göstəricilərinə, mübtəda-xəbər uzlaşmasına və söz sırasına yönəlt. Səhvlər Arxivindən təkrar edərək qaydanı möhkəmləndirə bilərsən!`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_BASE,
        maxOutputTokens: 700,
      },
    });
    return response.text || 'İzah hazırlandı, lakin mətn boş qayıtdı.';
  } catch (err) {
    console.error('Gemini explain error:', err);
    return (
      params.topic?.explanationAz ||
      'Hazırda AI izah xidmətində qısa gecikmə var. Zəhmət olmasa mövzunun qrammatika qeydinə baxın.'
    );
  }
}

export async function generateHint(params: {
  question: QuestionItem;
  topic?: GrammarTopic;
}): Promise<string> {
  const ai = getClient();
  if (!ai) {
    return (
      params.question.commonTrapAz ||
      params.topic?.commonMistakesAz[0] ||
      'İpucu: Cümlədəki zaman göstəricisinə və mübtədanın tək/cəm olmasına diqqət yetir.'
    );
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Sual: "${params.question.questionText}"\nMövzu: ${params.topic?.title || params.question.topicId}\nDüzgün cavabı BİRBAŞA DEMƏDƏN şagirdə Azərbaycan dilində 1-2 cümləlik ağıllı ipucu ver.`,
      config: {
        systemInstruction: SYSTEM_BASE,
        maxOutputTokens: 180,
      },
    });
    return response.text || 'İpucu: Cümlənin zaman göstəricisinə və fel formasına baxın.';
  } catch {
    return (
      params.question.commonTrapAz ||
      'İpucu: Zaman göstəricisi və mübtəda-xəbər uzlaşmasını yoxlayın.'
    );
  }
}

export async function generatePracticeQuestions(params: {
  topic: GrammarTopic;
  mode: LearningMode;
  count?: number;
}): Promise<Array<Partial<QuestionItem>>> {
  const count = Math.min(3, Math.max(1, params.count || 3));
  const ai = getClient();
  if (!ai) {
    return [
      {
        topicId: params.topic.id,
        cefrLevel: params.topic.cefrLevel,
        mode: params.mode,
        gameType: 'multiple_choice',
        difficulty: params.topic.difficulty,
        promptAz: `${params.topic.title} — əlavə məşq sualı:`,
        questionText: params.topic.examples[0]?.en || 'Choose the grammatically correct option.',
        options: [
          params.topic.examples[0]?.en || 'Option A',
          'Incorrect tense structure',
          'Missing auxiliary verb',
          'Wrong word order',
        ],
        correctAnswer: params.topic.examples[0]?.en || 'Option A',
        explanationAz: params.topic.explanationAz,
        sourceTag: 'ai-reviewed',
      },
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `${params.topic.title} (${params.topic.titleAz}) mövzusunda, CEFR ${params.topic.cefrLevel} səviyyəsində, ${
        params.mode === 'abituriyent' ? 'Azərbaycan DİM qəbul standartına uyğun' : 'Aptis ESOL hazırlığına uyğun orijinal'
      } ${count} ədəd 4-variantlı (multiple choice) qrammatika sualı yarat. Hər sualda "_____ " boşluğu olsun, Azərbaycan dilində izahı və tipik səhv xəbərdarlığı dəqiq yazılsın.`,
      config: {
        systemInstruction: SYSTEM_BASE,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              promptAz: { type: Type.STRING },
              questionText: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanationAz: { type: Type.STRING },
              commonTrapAz: { type: Type.STRING },
            },
            required: ['promptAz', 'questionText', 'options', 'correctAnswer', 'explanationAz'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item: any) =>
          item &&
          typeof item.questionText === 'string' &&
          Array.isArray(item.options) &&
          item.options.length >= 2 &&
          item.options.includes(item.correctAnswer)
      )
      .map((item: any) => ({
        topicId: params.topic.id,
        cefrLevel: params.topic.cefrLevel,
        mode: params.mode,
        gameType: 'multiple_choice' as const,
        difficulty: params.topic.difficulty,
        promptAz: item.promptAz,
        questionText: item.questionText,
        options: item.options,
        correctAnswer: item.correctAnswer,
        explanationAz: item.explanationAz,
        commonTrapAz: item.commonTrapAz || params.topic.commonMistakesAz[0],
        sourceTag: 'ai-reviewed' as const,
      }));
  } catch (err) {
    console.error('Gemini generatePracticeQuestions error:', err);
    return [];
  }
}
