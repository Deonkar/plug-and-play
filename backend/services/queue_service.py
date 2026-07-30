"""In-process async job queue. Swap this module for a Celery/ARQ backend without touching callers.

Interface:
    from services.queue_service import enqueue
    await enqueue(some_async_fn, arg1, arg2)   # non-blocking; runs on a worker task

Behaviour:
    - N background worker coroutines started at app startup
    - Failed jobs get 1 retry after 500ms; further failures logged + swallowed (never crash the app)
    - Optional: periodic `enqueue_periodic()` for recurring maintenance
"""
import asyncio
from typing import Callable, Awaitable, Any, Tuple, List
from logger import logger
from config import QUEUE_WORKERS

_queue: "asyncio.Queue[Tuple[Callable, Tuple, dict, int]]" = asyncio.Queue()
_workers: List[asyncio.Task] = []
_shutdown = asyncio.Event()


async def _worker(worker_id: int):
    logger.info(f"queue worker #{worker_id} started")
    while not _shutdown.is_set():
        try:
            job = await asyncio.wait_for(_queue.get(), timeout=1.0)
        except asyncio.TimeoutError:
            continue
        fn, args, kwargs, attempt = job
        try:
            await fn(*args, **kwargs)
        except Exception as e:
            if attempt == 0:
                logger.warning(f"queue job {fn.__name__} failed (attempt 1), retrying: {e}")
                await asyncio.sleep(0.5)
                await _queue.put((fn, args, kwargs, 1))
            else:
                logger.error(f"queue job {fn.__name__} permanently failed: {e}")
        finally:
            _queue.task_done()
    logger.info(f"queue worker #{worker_id} stopped")


async def enqueue(fn: Callable[..., Awaitable[Any]], *args, **kwargs):
    """Fire-and-forget: schedule `fn(*args, **kwargs)` on a worker."""
    await _queue.put((fn, args, kwargs, 0))


async def start_workers():
    if _workers:
        return
    for i in range(QUEUE_WORKERS):
        t = asyncio.create_task(_worker(i + 1))
        _workers.append(t)


async def stop_workers():
    _shutdown.set()
    for t in _workers:
        try: await asyncio.wait_for(t, timeout=2.0)
        except Exception: pass
    _workers.clear()


async def enqueue_periodic(fn: Callable[..., Awaitable[Any]], every_seconds: int, *args, **kwargs):
    """Convenience: run `fn` every N seconds. Starts a dedicated coroutine."""
    async def loop():
        while not _shutdown.is_set():
            try:
                await fn(*args, **kwargs)
            except Exception as e:
                logger.warning(f"periodic {fn.__name__} failed: {e}")
            try:
                await asyncio.wait_for(_shutdown.wait(), timeout=every_seconds)
                return
            except asyncio.TimeoutError:
                continue
    asyncio.create_task(loop())
