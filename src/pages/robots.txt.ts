import type { APIRoute } from 'astro';
import { renderRobotsTxt } from '../data/crawler-policy.mjs';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(renderRobotsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
