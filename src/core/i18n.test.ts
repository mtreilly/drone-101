import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./font-styles", () => ({ loadFontStyles: vi.fn(async () => {}) }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
const response = (label: string) => ({ ok: true, json: async () => ({ label }) });

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("document", { documentElement: {} });
  vi.stubGlobal("localStorage", { setItem: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe("language loading ownership", () => {
  it("keeps the active translation while loading and ignores a superseded language", async () => {
    const fr = deferred<ReturnType<typeof response>>();
    const de = deferred<ReturnType<typeof response>>();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => (url.includes("/fr/") ? fr.promise : de.promise)),
    );
    const { getLang, setLang, onLangChange } = await import("./i18n");
    const notify = vi.fn();
    onLangChange(notify);
    const first = setLang("fr");
    const second = setLang("de");
    expect(getLang()).toBe("en");
    de.resolve(response("German"));
    await second;
    fr.resolve(response("French"));
    await first;
    expect(getLang()).toBe("de");
    expect(notify.mock.calls).toEqual([["de"]]);
    expect(document.documentElement.lang).toBe("de");
  });

  it("a failed superseded request cannot roll back a successful switch", async () => {
    const fr = deferred<ReturnType<typeof response>>();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.includes("/fr/") ? fr.promise : Promise.resolve(response("German")),
      ),
    );
    const { getLang, setLang } = await import("./i18n");
    const first = setLang("fr");
    const failure = expect(first).rejects.toThrow("offline");
    await setLang("de");
    fr.reject(new Error("offline"));
    await failure;
    expect(getLang()).toBe("de");
  });

  it("returning to the active language cancels a pending switch", async () => {
    const fr = deferred<ReturnType<typeof response>>();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => fr.promise),
    );
    const { getLang, setLang } = await import("./i18n");
    const pending = setLang("fr");
    await setLang("en");
    fr.resolve(response("French"));
    await pending;
    expect(getLang()).toBe("en");
  });

  it("prefetch and navigation share a request, with retry after failure", async () => {
    const request = deferred<ReturnType<typeof response>>();
    const fetcher = vi
      .fn()
      .mockReturnValueOnce(request.promise)
      .mockResolvedValue(response("retry"));
    vi.stubGlobal("fetch", fetcher);
    const { loadNamespace, prefetchNamespace } = await import("./i18n");
    prefetchNamespace("ch01");
    const navigation = loadNamespace("ch01");
    expect(fetcher).toHaveBeenCalledTimes(1);
    request.reject(new Error("offline"));
    await expect(navigation).rejects.toThrow("offline");
    await loadNamespace("ch01");
    await loadNamespace("ch01");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
