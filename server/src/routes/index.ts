import { Router } from 'express';
import authRouter from './auth.routes';
import dashboardRouter from './dashboard.routes';
import chatRouter from './chat.routes';
import recordRouter from './record.routes';
import scannerRouter from './scanner.routes';
import appointmentRouter from './appointment.routes';
import adminRouter from './admin.routes';
import reminderRouter from './reminder.routes';
import triageRouter from './triage.routes';
import doctorRouter from './doctor.routes';

export const mainRouter = Router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/dashboard', dashboardRouter);
mainRouter.use('/chat', chatRouter);
mainRouter.use('/records', recordRouter);
mainRouter.use('/prescriptions', scannerRouter);
mainRouter.use('/appointments', appointmentRouter);
mainRouter.use('/admin', adminRouter);
mainRouter.use('/reminders', reminderRouter);
mainRouter.use('/clinical', triageRouter);
mainRouter.use('/doctor', doctorRouter);

export default mainRouter;
