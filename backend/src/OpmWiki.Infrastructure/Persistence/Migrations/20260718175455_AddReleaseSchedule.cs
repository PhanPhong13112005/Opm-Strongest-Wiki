using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace OpmWiki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReleaseSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "release_schedule",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Server = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    CharacterId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    BannerImage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsReturn = table.Column<bool>(type: "boolean", nullable: false),
                    OverrideNameVi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OverrideNameEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OverrideTier = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OverrideFactionVi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OverrideFactionEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OverrideTypeVi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OverrideTypeEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OverrideRoleVi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OverrideRoleEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_release_schedule", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "release_schedule",
                columns: new[] { "Id", "BannerImage", "CharacterId", "CreatedAt", "Date", "IsReturn", "OverrideFactionEn", "OverrideFactionVi", "OverrideNameEn", "OverrideNameVi", "OverrideRoleEn", "OverrideRoleVi", "OverrideTier", "OverrideTypeEn", "OverrideTypeVi", "Server", "SortOrder", "UpdatedAt" },
                values: new object[,]
                {
                    { 1L, "/Characters/Full_Background/Rover_URplus.png", "100316-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 6, 1), false, "", "", "", "", "", "", "", "", "", "CN", 1, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 2L, "/Characters/Full_Background/G5_URplus.png", "100314-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 6, 15), true, "", "", "", "", "", "", "", "", "", "CN", 2, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 3L, "/Characters/Full_Background/Nyan_URplus.png", "100312-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 6, 1), false, "", "", "", "", "", "", "", "", "", "SEA", 1, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 4L, "/Characters/Full_Background/Amai_Mask_Urplus.png", "100029-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 6, 15), true, "", "", "", "", "", "", "", "", "", "SEA", 2, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 5L, "/Characters/Full_Background/ZombIeMan_URplus.png", "100013-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 7, 1), false, "", "", "", "", "", "", "", "", "", "CN", 1, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 6L, "/Characters/Full_Background/Bang&Bomb_Urplus.png", "100315-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 7, 15), true, "", "", "", "", "", "", "", "", "", "CN", 2, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 7L, "/Characters/Full_Background/Atomic Samurai_URplus.png", "100313-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 7, 1), false, "", "", "", "", "", "", "", "", "", "SEA", 1, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 8L, "/Characters/Full_Background/Tatsumaki_URplus.png", "100180-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 7, 15), true, "", "", "", "", "", "", "", "", "", "SEA", 2, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 9L, "/Characters/Full_Background/Nhan_Vat_Bi_An.jpg", "unknown", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 8, 1), false, "UNKNOWN", "UNKNOWN", "Mystery Character", "Nhân Vật Bí Ẩn", "Hidden Potential", "Sức Mạnh Tiềm Ẩn", "UR+", "UNKNOWN", "UNKNOWN", "CN", 1, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 10L, "/Characters/Full_Background/Rover_URplus.png", "100316-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 8, 15), true, "", "", "", "", "", "", "", "", "", "CN", 2, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 11L, "/Characters/Full_Background/G5_URplus.png", "100314-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 8, 1), false, "", "", "", "", "", "", "", "", "", "SEA", 1, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { 12L, "/Characters/Full_Background/Nyan_URplus.png", "100312-urplus", new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateOnly(2026, 8, 15), true, "", "", "", "", "", "", "", "", "", "SEA", 2, new DateTimeOffset(new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_release_schedule_Date_Server_SortOrder",
                table: "release_schedule",
                columns: new[] { "Date", "Server", "SortOrder" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "release_schedule");
        }
    }
}
