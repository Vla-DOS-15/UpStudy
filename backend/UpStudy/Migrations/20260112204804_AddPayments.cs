using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpStudy.Migrations
{
    /// <inheritdoc />
    public partial class AddPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DirectPaymentRequest_Orders_OrderId",
                table: "DirectPaymentRequest");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DirectPaymentRequest",
                table: "DirectPaymentRequest");

            migrationBuilder.RenameTable(
                name: "DirectPaymentRequest",
                newName: "DirectPaymentRequests");

            migrationBuilder.RenameIndex(
                name: "IX_DirectPaymentRequest_OrderId",
                table: "DirectPaymentRequests",
                newName: "IX_DirectPaymentRequests_OrderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DirectPaymentRequests",
                table: "DirectPaymentRequests",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DirectPaymentRequests_Orders_OrderId",
                table: "DirectPaymentRequests",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DirectPaymentRequests_Orders_OrderId",
                table: "DirectPaymentRequests");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DirectPaymentRequests",
                table: "DirectPaymentRequests");

            migrationBuilder.RenameTable(
                name: "DirectPaymentRequests",
                newName: "DirectPaymentRequest");

            migrationBuilder.RenameIndex(
                name: "IX_DirectPaymentRequests_OrderId",
                table: "DirectPaymentRequest",
                newName: "IX_DirectPaymentRequest_OrderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DirectPaymentRequest",
                table: "DirectPaymentRequest",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DirectPaymentRequest_Orders_OrderId",
                table: "DirectPaymentRequest",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
