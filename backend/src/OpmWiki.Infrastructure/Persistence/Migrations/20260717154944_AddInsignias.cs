using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpmWiki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInsignias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "insignia_guides",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    TitleVi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TitleEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DescriptionVi = table.Column<string>(type: "text", nullable: false),
                    DescriptionEn = table.Column<string>(type: "text", nullable: false),
                    ImageUrls = table.Column<string[]>(type: "text[]", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_insignia_guides", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "insignias",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ClassLevel = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    NameVi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_insignias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "insignia_guide_links",
                columns: table => new
                {
                    InsigniaId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    GuideId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_insignia_guide_links", x => new { x.InsigniaId, x.GuideId });
                    table.ForeignKey(
                        name: "FK_insignia_guide_links_insignia_guides_GuideId",
                        column: x => x.GuideId,
                        principalTable: "insignia_guides",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_insignia_guide_links_insignias_InsigniaId",
                        column: x => x.InsigniaId,
                        principalTable: "insignias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_insignia_guide_links_GuideId",
                table: "insignia_guide_links",
                column: "GuideId");

            migrationBuilder.CreateIndex(
                name: "IX_insignia_guide_links_InsigniaId_SortOrder",
                table: "insignia_guide_links",
                columns: new[] { "InsigniaId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_insignias_ClassLevel",
                table: "insignias",
                column: "ClassLevel",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_insignias_SortOrder",
                table: "insignias",
                column: "SortOrder",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "insignia_guide_links");

            migrationBuilder.DropTable(
                name: "insignia_guides");

            migrationBuilder.DropTable(
                name: "insignias");
        }
    }
}
