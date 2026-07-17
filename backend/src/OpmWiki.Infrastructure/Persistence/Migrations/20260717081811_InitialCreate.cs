using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpmWiki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "characters",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    NameVi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Tier = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TypeVi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TypeEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FactionVi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FactionEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RolesVi = table.Column<string[]>(type: "text[]", nullable: false),
                    RolesEn = table.Column<string[]>(type: "text[]", nullable: false),
                    DuyenVi = table.Column<string>(type: "text", nullable: false),
                    DuyenEn = table.Column<string>(type: "text", nullable: false),
                    BioVi = table.Column<string>(type: "text", nullable: false),
                    BioEn = table.Column<string>(type: "text", nullable: false),
                    KeepsakeIcon = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TraitsVi = table.Column<string[]>(type: "text[]", nullable: false),
                    TraitsEn = table.Column<string[]>(type: "text[]", nullable: false),
                    BondListVi = table.Column<string>(type: "text", nullable: false),
                    BondListEn = table.Column<string>(type: "text", nullable: false),
                    ClassLevel = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ReleaseSea = table.Column<DateOnly>(type: "date", nullable: true),
                    ReleaseChina = table.Column<DateOnly>(type: "date", nullable: true),
                    base_atk = table.Column<int>(type: "integer", nullable: false),
                    base_hp = table.Column<int>(type: "integer", nullable: false),
                    base_def = table.Column<int>(type: "integer", nullable: false),
                    base_spd = table.Column<int>(type: "integer", nullable: false),
                    pvp_atk = table.Column<int>(type: "integer", nullable: false),
                    pvp_hp = table.Column<int>(type: "integer", nullable: false),
                    pvp_def = table.Column<int>(type: "integer", nullable: false),
                    pvp_spd = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_characters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "events",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TitleVi = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    TitleEn = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    DescriptionVi = table.Column<string>(type: "text", nullable: false),
                    DescriptionEn = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DetailImages = table.Column<string[]>(type: "text[]", nullable: false),
                    SectionsJson = table.Column<string>(type: "jsonb", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "character_effects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CharacterId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    TermVi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TermEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DescriptionVi = table.Column<string>(type: "text", nullable: false),
                    DescriptionEn = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_character_effects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_character_effects_characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "character_skills",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CharacterId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    NameVi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DescriptionVi = table.Column<string>(type: "text", nullable: false),
                    DescriptionEn = table.Column<string>(type: "text", nullable: false),
                    TypeVi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TypeEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AnimationUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    KeepsakeIconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_character_skills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_character_skills_characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_character_effects_CharacterId_SortOrder",
                table: "character_effects",
                columns: new[] { "CharacterId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_character_skills_CharacterId_SortOrder",
                table: "character_skills",
                columns: new[] { "CharacterId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_characters_NameEn",
                table: "characters",
                column: "NameEn");

            migrationBuilder.CreateIndex(
                name: "IX_characters_NameVi",
                table: "characters",
                column: "NameVi");

            migrationBuilder.CreateIndex(
                name: "IX_characters_Tier_FactionVi_TypeVi",
                table: "characters",
                columns: new[] { "Tier", "FactionVi", "TypeVi" });

            migrationBuilder.CreateIndex(
                name: "IX_events_Category",
                table: "events",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_events_StartDate_EndDate",
                table: "events",
                columns: new[] { "StartDate", "EndDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "character_effects");

            migrationBuilder.DropTable(
                name: "character_skills");

            migrationBuilder.DropTable(
                name: "events");

            migrationBuilder.DropTable(
                name: "characters");
        }
    }
}
