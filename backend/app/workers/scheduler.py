from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler(timezone="America/Santiago")


async def _send_weekly_summaries():
    print("[Scheduler] Enviando resúmenes semanales...")


async def _generate_recurring_transactions():
    print("[Scheduler] Generando transacciones recurrentes...")


async def _check_budget_alerts():
    print("[Scheduler] Verificando alertas de presupuesto...")


def start_scheduler():
    scheduler.add_job(
        _send_weekly_summaries,
        CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="weekly_summary",
        replace_existing=True,
    )
    scheduler.add_job(
        _generate_recurring_transactions,
        CronTrigger(hour=0, minute=5),
        id="recurring_transactions",
        replace_existing=True,
    )
    scheduler.add_job(
        _check_budget_alerts,
        CronTrigger(hour=9, minute=0),
        id="budget_alerts",
        replace_existing=True,
    )
    scheduler.start()
    print("[Scheduler] Iniciado.")


def stop_scheduler():
    scheduler.shutdown(wait=False)
    print("[Scheduler] Detenido.")