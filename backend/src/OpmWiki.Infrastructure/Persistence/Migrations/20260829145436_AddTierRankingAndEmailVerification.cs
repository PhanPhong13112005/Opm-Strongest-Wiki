using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpmWiki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTierRankingAndEmailVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EmailVerificationExpiresAt",
                table: "user_accounts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailVerificationTokenHash",
                table: "user_accounts",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmailVerified",
                table: "user_accounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PhoneVerified",
                table: "user_accounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "tier_ranking_baselines",
                columns: table => new
                {
                    CharacterId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    BaseVotes = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsCore = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    BaseOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedBySubject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tier_ranking_baselines", x => x.CharacterId);
                    table.CheckConstraint("CK_tier_ranking_baselines_BaseOrder", "\"BaseOrder\" >= 0");
                    table.CheckConstraint("CK_tier_ranking_baselines_BaseVotes", "\"BaseVotes\" >= 0");
                    table.CheckConstraint("CK_tier_ranking_baselines_Version", "\"Version\" >= 1");
                    table.ForeignKey(
                        name: "FK_tier_ranking_baselines_characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tier_ranking_votes",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CharacterId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    VoteMonth = table.Column<string>(type: "character(7)", nullable: false),
                    Rarity = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    VoteSlot = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tier_ranking_votes", x => new { x.UserId, x.CharacterId, x.VoteMonth });
                    table.CheckConstraint("CK_tier_ranking_votes_Rarity", "\"Rarity\" IN ('UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R')");
                    table.CheckConstraint("CK_tier_ranking_votes_VoteMonth", "\"VoteMonth\" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'");
                    table.CheckConstraint("CK_tier_ranking_votes_VoteSlot", "\"VoteSlot\" BETWEEN 1 AND 8");
                    table.ForeignKey(
                        name: "FK_tier_ranking_votes_characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tier_ranking_votes_user_accounts_UserId",
                        column: x => x.UserId,
                        principalTable: "user_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_accounts_EmailVerificationTokenHash",
                table: "user_accounts",
                column: "EmailVerificationTokenHash",
                unique: true,
                filter: "\"EmailVerificationTokenHash\" IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_user_accounts_EmailVerificationTokenHash",
                table: "user_accounts",
                sql: "\"EmailVerificationTokenHash\" IS NULL OR \"EmailVerificationTokenHash\" ~ '^[0-9a-f]{64}$'");

            migrationBuilder.AddCheckConstraint(
                name: "CK_user_accounts_EmailVerificationTokenPair",
                table: "user_accounts",
                sql: "(\"EmailVerificationTokenHash\" IS NULL AND \"EmailVerificationExpiresAt\" IS NULL) OR (\"EmailVerificationTokenHash\" IS NOT NULL AND \"EmailVerificationExpiresAt\" IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_tier_ranking_baselines_IsCore_BaseOrder_CharacterId",
                table: "tier_ranking_baselines",
                columns: new[] { "IsCore", "BaseOrder", "CharacterId" });

            migrationBuilder.CreateIndex(
                name: "IX_tier_ranking_votes_CharacterId",
                table: "tier_ranking_votes",
                column: "CharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_tier_ranking_votes_UserId_VoteMonth_Rarity_VoteSlot",
                table: "tier_ranking_votes",
                columns: new[] { "UserId", "VoteMonth", "Rarity", "VoteSlot" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tier_ranking_votes_VoteMonth_CharacterId",
                table: "tier_ranking_votes",
                columns: new[] { "VoteMonth", "CharacterId" });

            migrationBuilder.CreateIndex(
                name: "IX_tier_ranking_votes_VoteMonth_UserId",
                table: "tier_ranking_votes",
                columns: new[] { "VoteMonth", "UserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tier_ranking_baselines");

            migrationBuilder.DropTable(
                name: "tier_ranking_votes");

            migrationBuilder.DropIndex(
                name: "IX_user_accounts_EmailVerificationTokenHash",
                table: "user_accounts");

            migrationBuilder.DropCheckConstraint(
                name: "CK_user_accounts_EmailVerificationTokenHash",
                table: "user_accounts");

            migrationBuilder.DropCheckConstraint(
                name: "CK_user_accounts_EmailVerificationTokenPair",
                table: "user_accounts");

            migrationBuilder.DropColumn(
                name: "EmailVerificationExpiresAt",
                table: "user_accounts");

            migrationBuilder.DropColumn(
                name: "EmailVerificationTokenHash",
                table: "user_accounts");

            migrationBuilder.DropColumn(
                name: "EmailVerified",
                table: "user_accounts");

            migrationBuilder.DropColumn(
                name: "PhoneVerified",
                table: "user_accounts");
        }
    }
}
