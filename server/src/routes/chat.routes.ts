import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import chatService from '../services/chat.service';

export const chatRouter = Router();

chatRouter.use(authenticate);

chatRouter.get('/sessions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;
    if (!userId) {
      res.status(400).json({ status: 'error', message: 'User context missing' });
      return;
    }
    const sessions = await chatService.getSessions(userId);
    res.status(200).json({ status: 'success', data: sessions });
  } catch (error) {
    next(error);
  }
});

chatRouter.post('/sessions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;
    const { title } = req.body;
    if (!userId || !title) {
      res.status(400).json({ status: 'error', message: 'User ID and session title are required' });
      return;
    }
    const session = await chatService.createSession(userId, title);
    res.status(201).json({ status: 'success', data: session });
  } catch (error) {
    next(error);
  }
});

chatRouter.delete('/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    await chatService.deleteSession(sessionId);
    res.status(200).json({ status: 'success', message: 'Chat session deleted' });
  } catch (error) {
    next(error);
  }
});

chatRouter.get('/sessions/:sessionId/messages', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const messages = await chatService.getMessages(sessionId);
    res.status(200).json({ status: 'success', data: messages });
  } catch (error) {
    next(error);
  }
});

chatRouter.post('/sessions/:sessionId/stream', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ status: 'error', message: 'Message content is required' });
      return;
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const lang = (req.headers['x-language'] || req.headers['accept-language'] || 'en') as string;

    await chatService.streamResponse(
      sessionId,
      message,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
      (completeText) => {
        res.write(`data: [DONE]\n\n`);
        res.end();
      },
      lang
    );
  } catch (error) {
    // If headers are already sent, close stream, else delegate to global error handler
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  }
});

export default chatRouter;
