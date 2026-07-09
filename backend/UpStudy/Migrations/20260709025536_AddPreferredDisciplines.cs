using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpStudy.Migrations
{
    /// <inheritdoc />
    public partial class AddPreferredDisciplines : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUserDiscipline",
                columns: table => new
                {
                    ExecutorsId = table.Column<string>(type: "text", nullable: false),
                    PreferredDisciplinesId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUserDiscipline", x => new { x.ExecutorsId, x.PreferredDisciplinesId });
                    table.ForeignKey(
                        name: "FK_AppUserDiscipline_AspNetUsers_ExecutorsId",
                        column: x => x.ExecutorsId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppUserDiscipline_Disciplines_PreferredDisciplinesId",
                        column: x => x.PreferredDisciplinesId,
                        principalTable: "Disciplines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppUserDiscipline_PreferredDisciplinesId",
                table: "AppUserDiscipline",
                column: "PreferredDisciplinesId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppUserDiscipline");
        }
    }
}
