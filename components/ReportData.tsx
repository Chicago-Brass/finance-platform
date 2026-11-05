"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cachedReport, readReport, ReportRequestError } from "@/lib/reports/report-data-client";
import type { ReportCache } from "@/lib/reports/report-data-client";
import { createClient } from "@/lib/supabase/client";

export type ReportQuery<T> = { data: T | undefined; pending: boolean; error: boolean; retry: () => void };

type DataContext = {
  cache: ReportCache;
  revision: number;
  fetching: boolean;
  read: <T>(url: string) => Promise<T>;
  refresh: () => void;
};

const Context = createContext<DataContext | null>(null);

export function ReportDataProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [cache] = useState<ReportCache>(() => new Map());
  const expectedUser = useRef(userId);
  const [revision, setRevision] = useState(0), [fetching, setFetching] = useState(0);
  const track = useCallback((delta: number) => setFetching(count => count + delta), []);
  const read = useCallback(<T,>(url: string) => readReport<T>(cache, url, track), [cache, track]);
  const refresh = useCallback(() => { cache.clear(); setRevision(value => value + 1); }, [cache]);
  useEffect(() => {
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" && expectedUser.current === undefined) expectedUser.current = session?.user.id;
      if (event === "SIGNED_OUT" || (event === "SIGNED_IN" && session?.user.id !== expectedUser.current)) {
        cache.clear();
        window.location.assign("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [cache]);
  const value = useMemo(() => ({ cache, revision, fetching: fetching > 0, read, refresh }), [cache, revision, fetching, read, refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

function useData() {
  const context = useContext(Context);
  if (!context) throw new Error("Report data provider is missing.");
  return context;
}

export function useReportQuery<T>(url: string | null): ReportQuery<T> {
  const { cache, revision, read } = useData();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ url: string; revision: number; attempt: number; data?: T; error: boolean } | null>(null);
  const retry = useCallback(() => { if (url) cache.delete(url); setAttempt(value => value + 1); }, [cache, url]);

  useEffect(() => {
    if (url === null) return;
    let current = true;
    read<T>(url).then(
      data => { if (current) setResult({ url, revision, attempt, data, error: false }); },
      error => {
        if (!current) return;
        if (error instanceof ReportRequestError && (error.status === 401 || error.status === 403)) {
          cache.clear();
          window.location.assign(error.status === 401 ? "/" : "/not-authorized");
        }
        setResult({ url, revision, attempt, error: true });
      },
    );
    return () => { current = false; };
  }, [url, revision, attempt, cache, read]);

  const current = result?.url === url && result.revision === revision && result.attempt === attempt ? result : null;
  const cached = url === null ? undefined : cachedReport<T>(cache, url);
  const data = url === null ? undefined : cached !== undefined ? cached : current?.data;
  const error = current?.error ?? false;
  return { data, pending: url !== null && data === undefined && !error, error, retry };
}

export function useReportRefresh() { return useData().refresh; }
export function useReportFetching() { return useData().fetching; }
