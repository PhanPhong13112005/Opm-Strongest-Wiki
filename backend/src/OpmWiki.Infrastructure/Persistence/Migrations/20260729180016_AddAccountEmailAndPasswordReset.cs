using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpmWiki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountEmailAndPasswordReset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "user_accounts",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NormalizedEmail",
                table: "user_accounts",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PasswordResetExpiresAt",
                table: "user_accounts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetTokenHash",
                table: "user_accounts",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_accounts_NormalizedEmail",
                table: "user_accounts",
                column: "NormalizedEmail",
                unique: true,
                filter: "\"NormalizedEmail\" <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_user_accounts_NormalizedEmail",
                table: "user_accounts");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "user_accounts");

            migrationBuilder.DropColumn(
                name: "NormalizedEmail",
                table: "user_accounts");

            migrationBuilder.DropColumn(
                name: "PasswordResetExpiresAt",
                table: "user_accounts");

            migrationBuilder.DropColumn(
                name: "PasswordResetTokenHash",
                table: "user_accounts");
        }
    }
}
