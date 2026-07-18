using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpmWiki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTactics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tactic_cards",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    NameVi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Icon = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Count = table.Column<int>(type: "integer", nullable: false),
                    EffectVi = table.Column<string>(type: "text", nullable: false),
                    EffectEn = table.Column<string>(type: "text", nullable: false),
                    ScalingJson = table.Column<string>(type: "jsonb", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tactic_cards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tactic_frames",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Icon = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Hp = table.Column<int>(type: "integer", nullable: false),
                    Def = table.Column<int>(type: "integer", nullable: false),
                    ColorClass = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BorderClass = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BackgroundClass = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tactic_frames", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tactic_cards_SortOrder",
                table: "tactic_cards",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_tactic_frames_SortOrder",
                table: "tactic_frames",
                column: "SortOrder");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tactic_cards");

            migrationBuilder.DropTable(
                name: "tactic_frames");
        }
    }
}
