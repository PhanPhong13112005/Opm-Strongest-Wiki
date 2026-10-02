using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpmWiki.Infrastructure.Persistence.Migrations;

public partial class AddReleaseScheduleMonthPrecision : Migration
{
    // Exact SQL is also rehearsed by the disposable PostgreSQL tests. EF executes each migration transactionally.
    // Schema only: no schedule seed, character import, or production reconciliation.
    public const string UpSql = """
        ALTER TABLE public.release_schedule ALTER COLUMN "Date" DROP NOT NULL;
        ALTER TABLE public.release_schedule ADD COLUMN "DatePrecision" varchar(5) NOT NULL DEFAULT 'day';
        ALTER TABLE public.release_schedule ADD COLUMN "ReleaseMonth" varchar(7);
        ALTER TABLE public.release_schedule ADD CONSTRAINT "CK_release_schedule_DatePrecision" CHECK (
            ("DatePrecision" = 'day' AND "Date" IS NOT NULL AND "ReleaseMonth" IS NULL) OR
            ("DatePrecision" = 'month' AND "Date" IS NULL AND "ReleaseMonth" IS NOT NULL AND
                "ReleaseMonth" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$' AND left("ReleaseMonth", 4) <> '0000')
        );
        CREATE UNIQUE INDEX "IX_release_schedule_ReleaseMonth_Server_SortOrder"
            ON public.release_schedule ("ReleaseMonth", "Server", "SortOrder") WHERE "DatePrecision" = 'month';
        """;

    public const string DownSql = """
        DO $guard$
        BEGIN
            IF EXISTS (SELECT 1 FROM public.release_schedule
                WHERE "Date" IS NULL OR "DatePrecision" <> 'day' OR "ReleaseMonth" IS NOT NULL) THEN
                RAISE EXCEPTION 'Cannot downgrade while month-only schedules exist. Reconcile audited rows separately first.';
            END IF;
        END $guard$;
        DROP INDEX public."IX_release_schedule_ReleaseMonth_Server_SortOrder";
        ALTER TABLE public.release_schedule DROP CONSTRAINT "CK_release_schedule_DatePrecision";
        ALTER TABLE public.release_schedule DROP COLUMN "ReleaseMonth";
        ALTER TABLE public.release_schedule DROP COLUMN "DatePrecision";
        ALTER TABLE public.release_schedule ALTER COLUMN "Date" SET NOT NULL;
        """;

    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql(UpSql);

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Never destroy month rows or fabricate dates to make a downgrade succeed.
        migrationBuilder.Sql(DownSql);
    }
}
