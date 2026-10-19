import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { debounce } from "./debounce";

describe("standalone debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defers execution until delay expires", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced("a");
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(249);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("cancels pending execution cleanly", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced("test");
    debounced.cancel();

    vi.advanceTimersByTime(400);
    expect(fn).not.toHaveBeenCalled();
  });

  it("flushes pending execution immediately", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced("flush-now");
    debounced.flush();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("flush-now");
  });
});
