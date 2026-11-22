import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { explainGrammarOrMistake, generateHint, generatePracticeQuestions } from './src/server/aiService.ts';
import { store, verifySessionToken } from './src/server/store.ts';
import { CefrLevelCode, GameType, LearningMode, SubscriptionPlanCode } from './src/types/gamify.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuthedRequest extends Request {
  auth?: { sub: string; role: 'student' | 'admin' };
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Giriş tələb olunur.' });
  }
  const token = header.slice('Bearer '.length).trim();
  const decoded = verifySessionToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Sessiya etibarsızdır və ya vaxtı bitib.' });
  }
  req.auth = decoded;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role !== 'admin') {
    return res.status(403).json({ error: 'Bu bölmə yalnız administratorlar üçündür.' });
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // ======================== PUBLIC & AUTH ROUTES ========================
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'gamify-nurdan-teacher' });
  });

  app.get('/api/public/bootstrap', (_req, res) => {
    res.json({
      topicsCount: store.getTopics().length,
      questionsCount: store.getQuestions().length,
      plans: store.getSubscriptionPlans(),
      adminBootstrap: store.getBootstrapStatus(),
    });
  });

  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, nickname, fullName, mode } = req.body || {};
      const result = store.registerUser({ email, password, nickname, fullName, mode });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Qeydiyyat zamanı xəta baş verdi.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body || {};
      const result = store.loginUser(String(email || ''), String(password || ''));
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err?.message || 'Daxil olma uğursuz oldu.' });
    }
  });

  app.post('/api/auth/demo', (_req, res) => {
    try {
      const result = store.getDemoSession();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Sınaq sessiyası yaradıla bilmədi.' });
    }
  });

  app.post('/api/auth/admin/claim', (req, res) => {
    try {
      const { email, nickname, password } = req.body || {};
      const result = store.claimInitialAdmin(String(email || ''), String(nickname || ''), String(password || ''));
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Admin quraşdırılması uğursuz oldu.' });
    }
  });

  app.post('/api/auth/admin/login', (req, res) => {
    try {
      const { email, passcode } = req.body || {};
      const result = store.loginAdminWithPasscode(String(email || ''), String(passcode || ''));
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err?.message || 'Admin girişi uğursuz oldu.' });
    }
  });

  // ======================== STUDENT PROFILE & CURRICULUM ========================
  app.get('/api/me', requireAuth, (req: AuthedRequest, res) => {
    const user = store.getUserById(req.auth!.sub);
    if (!user) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
    res.json({
      user,
      progress: store.getUserProgress(user.id),
      badges: store.getUserBadges(user.id),
      analytics: store.getAnalytics(user.id),
      dailyAiUsed: store.getDailyAiCount(user.id),
    });
  });

  app.patch('/api/me', requireAuth, (req: AuthedRequest, res) => {
    try {
      const updated = store.updateProfile(req.auth!.sub, req.body || {});
      res.json({ user: updated });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Profil yenilənmədi.' });
    }
  });

  app.post('/api/me/bookmark', requireAuth, (req: AuthedRequest, res) => {
    try {
      const { topicId } = req.body || {};
      const bookmarkedTopics = store.toggleBookmarkTopic(req.auth!.sub, String(topicId || ''));
      const user = store.getUserById(req.auth!.sub);
      res.json({ bookmarkedTopics, user });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Qeyd yenilənmədi.' });
    }
  });

  app.get('/api/topics', (req, res) => {
    const mode = req.query.mode as LearningMode | undefined;
    const cefrLevel = req.query.cefrLevel as CefrLevelCode | undefined;
    res.json({ topics: store.getTopics({ mode, cefrLevel }) });
  });

  app.get('/api/questions', requireAuth, (req: AuthedRequest, res) => {
    const topicId = req.query.topicId as string | undefined;
    const cefrLevel = req.query.cefrLevel as CefrLevelCode | undefined;
    const mode = req.query.mode as LearningMode | undefined;
    const gameType = req.query.gameType as GameType | undefined;

    const user = store.getUserById(req.auth!.sub);
    if (!user) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
    const plan = store.getSubscriptionPlans().find((p) => p.code === user.subscriptionPlan);
    let questions = store.getQuestions({ topicId, cefrLevel, mode, gameType });
    if (plan && user.role !== 'admin') {
      questions = questions.filter((q) => plan.unlockedCefr.includes(q.cefrLevel));
    }
    res.json({ questions });
  });

  app.post('/api/answers/submit', requireAuth, (req: AuthedRequest, res) => {
    try {
      const { questionId, submittedAnswer, mode, responseSeconds, sessionPerfectSoFar } = req.body || {};
      const result = store.submitAnswer(req.auth!.sub, {
        questionId: String(questionId || ''),
        submittedAnswer: String(submittedAnswer ?? ''),
        mode: mode === 'aptis' ? 'aptis' : 'abituriyent',
        responseSeconds: Number(responseSeconds) || 15,
        sessionPerfectSoFar: Boolean(sessionPerfectSoFar),
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Cavab göndərilərkən xəta baş verdi.' });
    }
  });

  app.get('/api/mistakes', requireAuth, (req: AuthedRequest, res) => {
    res.json({ mistakes: store.getUserMistakes(req.auth!.sub) });
  });

  // ======================== GAMIFICATION, SHOP, CHALLENGES & LEADERBOARD ========================
  app.get('/api/shop', requireAuth, (_req, res) => {
    res.json({ items: store.getShopCatalog() });
  });

  app.post('/api/shop/buy', requireAuth, (req: AuthedRequest, res) => {
    try {
      const { itemId } = req.body || {};
      const user = store.buyShopItem(req.auth!.sub, String(itemId || ''));
      res.json({ user });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Alış baş tutmadı.' });
    }
  });

  app.get('/api/challenges/daily', requireAuth, (req: AuthedRequest, res) => {
    res.json(store.getDailyChallenge(req.auth!.sub));
  });

  app.post('/api/challenges/daily/complete', requireAuth, (req: AuthedRequest, res) => {
    try {
      const result = store.completeDailyChallenge(req.auth!.sub);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Gündəlik tapşırıq tamamlanmadı.' });
    }
  });

  app.get('/api/challenges/boss', requireAuth, (req: AuthedRequest, res) => {
    const data = store.getBossChallenges(req.auth!.sub);
    const enriched = data.challenges.map((boss) => ({
      ...boss,
      questions: boss.questionIds
        .map((qid) => store.getQuestions({ includeUnpublished: false }).find((q) => q.id === qid))
        .filter(Boolean),
    }));
    res.json({ challenges: enriched, completedIds: data.completedIds });
  });

  app.post('/api/challenges/boss/complete', requireAuth, (req: AuthedRequest, res) => {
    try {
      const { bossId, scorePercent } = req.body || {};
      const result = store.completeBossChallenge(req.auth!.sub, String(bossId || ''), Number(scorePercent) || 0);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Boss nəticəsi qeyd edilmədi.' });
    }
  });

  app.get('/api/leaderboard', (req, res) => {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'overall') || 'weekly';
    res.json({ entries: store.getLeaderboard(period), period });
  });

  app.get('/api/subscriptions', (_req, res) => {
    res.json({ plans: store.getSubscriptionPlans() });
  });

  app.post('/api/subscriptions/checkout', requireAuth, (req: AuthedRequest, res) => {
    try {
      const { planCode, billingCycle, activatePreviewMode } = req.body || {};
      const result = store.prepareSubscriptionCheckout(
        req.auth!.sub,
        planCode as SubscriptionPlanCode,
        billingCycle === 'yearly' ? 'yearly' : 'monthly',
        Boolean(activatePreviewMode)
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Abunəlik əməliyyatı uğursuz oldu.' });
    }
  });

  // ======================== NURDAN TEACHER AI ROUTES ========================
  function assertAiQuota(userId: string) {
    const user = store.getUserById(userId);
    if (!user) throw new Error('İstifadəçi tapılmadı.');
    if (user.role === 'admin') return user;
    const plan = store.getSubscriptionPlans().find((p) => p.code === user.subscriptionPlan);
    const used = store.getDailyAiCount(userId);
    if (plan && used >= plan.dailyAiLimit) {
      throw new Error(
        `Gündəlik Nurdan Teacher AI sorğu limitinə (${plan.dailyAiLimit}) çatdınız. Limitsiz AI izah üçün PRO plana keçid edə bilərsiniz.`
      );
    }
    return user;
  }

  app.post('/api/ai/explain', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const user = assertAiQuota(req.auth!.sub);
      const { topicId, questionText, userAnswer, correctAnswer, customPrompt } = req.body || {};
      const topic = store.getTopics().find((t) => t.id === topicId);
      const reply = await explainGrammarOrMistake({
        topic,
        questionText,
        userAnswer,
        correctAnswer,
        cefrLevel: topic?.cefrLevel || user.currentCefr,
        mode: user.activeMode,
        customPrompt,
      });
      store.logAiInteraction({
        userId: user.id,
        topicId: topic?.id,
        actionType: customPrompt ? 'chat' : 'explain',
        promptSummary: String(customPrompt || questionText || topic?.title || 'İzah sorğusu').slice(0, 120),
        responsePreview: reply.slice(0, 180),
      });
      res.json({ reply, dailyAiUsed: store.getDailyAiCount(user.id) });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Nurdan Teacher cavab verə bilmədi.' });
    }
  });

  app.post('/api/ai/hint', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const user = assertAiQuota(req.auth!.sub);
      const { questionId } = req.body || {};
      const question = store.getQuestions({ includeUnpublished: true }).find((q) => q.id === questionId);
      if (!question) return res.status(404).json({ error: 'Sual tapılmadı.' });
      const topic = store.getTopics().find((t) => t.id === question.topicId);
      const hint = await generateHint({ question, topic });
      store.logAiInteraction({
        userId: user.id,
        topicId: question.topicId,
        actionType: 'hint',
        promptSummary: question.questionText.slice(0, 100),
        responsePreview: hint.slice(0, 160),
      });
      res.json({ hint, dailyAiUsed: store.getDailyAiCount(user.id) });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'İpucu yaradılmadı.' });
    }
  });

  app.post('/api/ai/generate-practice', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const user = assertAiQuota(req.auth!.sub);
      const { topicId, saveToBank } = req.body || {};
      const topic = store.getTopics().find((t) => t.id === topicId) || store.getTopics()[0];
      const generated = await generatePracticeQuestions({
        topic,
        mode: user.activeMode,
        count: 3,
      });
      const savedQuestions: any[] = [];
      for (const q of generated) {
        if (saveToBank && user.role === 'admin') {
          try {
            savedQuestions.push(store.upsertQuestion({ ...q, isPublished: false }));
          } catch {
            // Skip duplicates during auto-save
          }
        }
      }
      store.logAiInteraction({
        userId: user.id,
        topicId: topic.id,
        actionType: 'generate_practice',
        promptSummary: `${topic.title} (${user.activeMode})`,
        responsePreview: `${generated.length} yeni məşq sualı hazırlandı`,
      });
      res.json({
        questions: generated,
        savedPendingCount: savedQuestions.length,
        dailyAiUsed: store.getDailyAiCount(user.id),
      });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Sual generasiyası uğursuz oldu.' });
    }
  });

  // ======================== ADMIN ROUTES ========================
  app.get('/api/admin/overview', requireAuth, requireAdmin, (_req, res) => {
    res.json(store.getAdminOverview());
  });

  app.get('/api/admin/questions', requireAuth, requireAdmin, (_req, res) => {
    res.json({ questions: store.getQuestions({ includeUnpublished: true }) });
  });

  app.post('/api/admin/questions', requireAuth, requireAdmin, (req, res) => {
    try {
      const saved = store.upsertQuestion(req.body || {});
      res.status(201).json({ question: saved });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Sual yadda saxlanmadı.' });
    }
  });

  app.delete('/api/admin/questions/:id', requireAuth, requireAdmin, (req, res) => {
    store.deleteQuestion(req.params.id);
    res.json({ deleted: true });
  });

  app.post('/api/admin/questions/import-csv', requireAuth, requireAdmin, (req, res) => {
    try {
      const { csvText } = req.body || {};
      const report = store.importQuestionsCsv(String(csvText || ''));
      res.json(report);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'CSV idxalı uğursuz oldu.' });
    }
  });

  app.patch('/api/admin/topics/:id', requireAuth, requireAdmin, (req, res) => {
    try {
      const updated = store.updateTopic(req.params.id, req.body || {});
      res.json({ topic: updated });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Mövzu yenilənmədi.' });
    }
  });

  app.patch('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
    try {
      const updated = store.adminUpdateUser(req.params.id, req.body || {});
      res.json({ user: updated });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'İstifadəçi yenilənmədi.' });
    }
  });

  app.patch('/api/admin/plans/:code', requireAuth, requireAdmin, (req, res) => {
    try {
      const { monthlyPriceAzn, yearlyPriceAzn } = req.body || {};
      const plans = store.updateSubscriptionPlanPrice(
        req.params.code as SubscriptionPlanCode,
        Number(monthlyPriceAzn),
        Number(yearlyPriceAzn)
      );
      res.json({ plans });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Plan qiyməti yenilənmədi.' });
    }
  });

  // ======================== VITE / STATIC FRONTEND ========================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`GAMIFY server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
