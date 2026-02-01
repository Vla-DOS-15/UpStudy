using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpStudy.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentRequestDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CardNumber",
                table: "DirectPaymentRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CardOwnerName",
                table: "DirectPaymentRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReceiptS3Key",
                table: "DirectPaymentRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectReason",
                table: "DirectPaymentRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankCardOwnerName",
                table: "AspNetUsers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CardNumber",
                table: "DirectPaymentRequests");

            migrationBuilder.DropColumn(
                name: "CardOwnerName",
                table: "DirectPaymentRequests");

            migrationBuilder.DropColumn(
                name: "ReceiptS3Key",
                table: "DirectPaymentRequests");

            migrationBuilder.DropColumn(
                name: "RejectReason",
                table: "DirectPaymentRequests");

            migrationBuilder.DropColumn(
                name: "BankCardOwnerName",
                table: "AspNetUsers");
        }
    }
}
