using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpStudy.Migrations
{
    /// <inheritdoc />
    public partial class PrivateCandidatesChat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Chats_OrderId",
                table: "Chats");

            migrationBuilder.AddColumn<string>(
                name: "ParticipantId",
                table: "Chats",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Chats_OrderId",
                table: "Chats",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Chats_ParticipantId",
                table: "Chats",
                column: "ParticipantId");

            migrationBuilder.AddForeignKey(
                name: "FK_Chats_AspNetUsers_ParticipantId",
                table: "Chats",
                column: "ParticipantId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Chats_AspNetUsers_ParticipantId",
                table: "Chats");

            migrationBuilder.DropIndex(
                name: "IX_Chats_OrderId",
                table: "Chats");

            migrationBuilder.DropIndex(
                name: "IX_Chats_ParticipantId",
                table: "Chats");

            migrationBuilder.DropColumn(
                name: "ParticipantId",
                table: "Chats");

            migrationBuilder.CreateIndex(
                name: "IX_Chats_OrderId",
                table: "Chats",
                column: "OrderId",
                unique: true);
        }
    }
}
