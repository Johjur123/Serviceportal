import type { Request, Response } from 'express';
import { db } from './db';
import { sessions } from '@shared/schema';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Database check
    await db.select().from(sessions).limit(1);
    
    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    // Only alert on critical memory usage in production
    if (process.env.NODE_ENV === 'production' && memUsagePercent > 90) {
      throw new Error('Critical memory usage');
    }
    
    // CPU check (basic)
    const uptime = process.uptime();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date(),
      memory: memUsagePercent.toFixed(2) + '%',
      uptime: Math.floor(uptime) + 's',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date()
    });
  }
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: any) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
    return originalSend.call(this, data);
  };
  
  next();
};