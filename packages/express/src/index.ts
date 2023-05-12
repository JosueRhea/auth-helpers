import {
  CookieOptions,
  createServerSupabaseClient,
  parseCookies,
  serializeCookie,
  SupabaseClientOptionsWithoutAuth
} from '@supabase/auth-helpers-shared';
import { SupabaseClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';

export function createServerClient<
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database
>(
  supabaseUrl: string,
  supabaseKey: string,
  {
    request,
    response,
    options,
    cookieOptions
  }: {
    request: Request;
    response: Response;
    options?: SupabaseClientOptionsWithoutAuth<SchemaName>;
    cookieOptions?: CookieOptions;
  }
): SupabaseClient<Database, SchemaName> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'supabaseUrl and supabaseKey are required to create a Supabase client! Find these under `Settings` > `API` in your Supabase dashboard.'
    );
  }

  if (!request || !response) {
    throw new Error(
      'request and response must be passed to createSupabaseClient function, when called from loader or action'
    );
  }

  return createServerSupabaseClient<Database, SchemaName>({
    supabaseUrl,
    supabaseKey,
    getRequestHeader: (key) => {
      return request.headers[key] ?? undefined;
    },
    getCookie: (name) => {
      return parseCookies(request?.cookies[name] ?? '')[name];
    },
    setCookie(name, value, options) {
      // const cookieStr = serializeCookie(name, value, {
      //   ...options,
      //   // Allow supabase-js on the client to read the cookie as well
      //   httpOnly: false
      // });
      // response.headers.set('set-cookie', cookieStr);
      response.cookie(name, value, options);
    },
    options: {
      ...options,
      global: {
        ...options?.global,
        headers: {
          ...options?.global?.headers,
          'X-Client-Info': `${PACKAGE_NAME}@${PACKAGE_VERSION}`
        }
      }
    },
    cookieOptions
  });
}
