# Give the route ownership of chapter resources

Previously the lifecycle contract meant "a factory may return a cleanup". That covered loops and some bus events but did not name ownership of resources allocated before the factory returned. Plots subscribed to theme changes, and responsive views observed detached DOM indefinitely. Later chapter visits added more retained data and redraw work.

The insight is that all these resources share the **mounted chapter lifetime**, even though their drawing and physics remain different. `WidgetCtx.onCleanup` lets factories register resources at creation. Plot, SPlane and DroneView optionally accept registration; helper factories pass it through. TracePlayer owns and disposes its internal resources. App owns the callback list for one route and prevents stale async loads from obtaining a mount.

This removes repeated reliance on remembering every teardown at the bottom of every widget, stops off-page theme/resize work, and makes partial resource construction reviewable. It introduces one small lifecycle capability rather than a global resource manager, mutation observer or widget inheritance hierarchy. Local loop and bus cleanup remains explicit and factories still return callbacks. See resolved F-001 for measured before/after.

Trade-off: callers creating these views outside a chapter must call destroy themselves or supply their owner. Every new resource type still needs a truthful disposal implementation. Tests and navigation checks should verify that actual resources stop, rather than merely checking that a callback was registered.
