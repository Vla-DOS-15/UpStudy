using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpStudy.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence<int>(
                name: "OrderNumberSeq",
                startValue: 1000L);

            migrationBuilder.AddColumn<int>(
                name: "OrderNumber",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValueSql: "nextval('\"OrderNumberSeq\"')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderNumber",
                table: "Orders");

            migrationBuilder.DropSequence(
                name: "OrderNumberSeq");
        }
    }
}
