using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpStudy.Migrations
{
    /// <inheritdoc />
    public partial class ConvertToS3Storage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FilePath",
                table: "OrderAttachments",
                newName: "S3Key");

            migrationBuilder.RenameColumn(
                name: "FilePath",
                table: "ChatAttachments",
                newName: "S3Key");

            migrationBuilder.AddColumn<string>(
                name: "AvatarS3Key",
                table: "AspNetUsers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarS3Key",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "S3Key",
                table: "OrderAttachments",
                newName: "FilePath");

            migrationBuilder.RenameColumn(
                name: "S3Key",
                table: "ChatAttachments",
                newName: "FilePath");
        }
    }
}
