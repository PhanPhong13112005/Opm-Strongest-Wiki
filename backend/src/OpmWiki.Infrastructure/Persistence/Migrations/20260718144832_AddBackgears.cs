using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpmWiki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBackgears : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "backgear_sets",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    NameVi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RarityVi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RarityEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RewardVi = table.Column<string>(type: "text", nullable: false),
                    RewardEn = table.Column<string>(type: "text", nullable: false),
                    RewardIconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    NeedsJson = table.Column<string>(type: "jsonb", nullable: false),
                    LevelsJson = table.Column<string>(type: "jsonb", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_backgear_sets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "backgears",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    NameVi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Theme = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    RarityVi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RarityEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AcquireVi = table.Column<string>(type: "text", nullable: false),
                    AcquireEn = table.Column<string>(type: "text", nullable: false),
                    LevelMax = table.Column<int>(type: "integer", nullable: false),
                    IconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SeniorIconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ChangeLevel = table.Column<int>(type: "integer", nullable: true),
                    LevelsJson = table.Column<string>(type: "jsonb", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_backgears", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_backgear_sets_SortOrder",
                table: "backgear_sets",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_backgears_SortOrder",
                table: "backgears",
                column: "SortOrder");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "backgear_sets");

            migrationBuilder.DropTable(
                name: "backgears");
        }
    }
}
