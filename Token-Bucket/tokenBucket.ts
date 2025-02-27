import { Request, Response, NextFunction} from "express";
import Redis from "ioredis";

const redis = new Redis();

const BUCKET_CAPACITY = 10;
const TOKEN_REFILL_RATE = 1;

async function getTokens(ip: string): Promise<number>{
    const key = `rate_limit${ip}`;
    const data = await redis.hgetall(key);
    const now = Date.now() / 1000;

    let tokens = BUCKET_CAPACITY;
    let lastRefill = now;

    if(data.tokens && data.last_refill){
        tokens = parseInt(data.tokens);
        lastRefill = parseFloat(data.last_refill);

        const elapsed = now - lastRefill;
        tokens = Math.min(BUCKET_CAPACITY, tokens + Math.floor(elapsed))
    }
    await redis.hmset(key, {tokens, last_refill: now});
    await redis.expire(key, 60);

    return tokens;
}

async function consumeToken(ip: string): Promise<boolean>{
    const tokens = await getTokens(ip);
    if(tokens>0){
        await redis.hincrby(`rate_limit:${ip}`,"tokens",-1);
        return true;
    }
    return false;
}

export async function rateLimitter(req: Request, res: Response, next: NextFunction){
    const ip = req.ip || req.connection.remoteAddress || "unknown";

    if (await consumeToken(ip)){
        next();
    } else {
        res.status(429).json({error: "Too many reqs, slow down!"});
        
    }
}
    
