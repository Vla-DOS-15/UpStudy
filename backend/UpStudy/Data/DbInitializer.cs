using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpStudy.Models;

namespace UpStudy.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Застосовуємо міграції, якщо база ще не створена
        await context.Database.MigrateAsync();

        // Перевірка: якщо вже є користувачі, значить база не порожня -> виходимо
        if (!await context.Directions.AnyAsync(d => d.Name == "Технічні"))
        {
            var dirТехнічні = new Direction { Name = "Технічні" };
            context.Directions.Add(dirТехнічні);
            var dirПравові = new Direction { Name = "Правові" };
            context.Directions.Add(dirПравові);
            var dirПриродні = new Direction { Name = "Природні" };
            context.Directions.Add(dirПриродні);
            var dirЕкономічні = new Direction { Name = "Економічні" };
            context.Directions.Add(dirЕкономічні);
            var dirМедичні = new Direction { Name = "Медичні" };
            context.Directions.Add(dirМедичні);
            var dirМови = new Direction { Name = "Мови" };
            context.Directions.Add(dirМови);
            var dirГуманітарні = new Direction { Name = "Гуманітарні" };
            context.Directions.Add(dirГуманітарні);
            var dirКомпютерні = new Direction { Name = "Комп'ютерні" };
            context.Directions.Add(dirКомпютерні);
            await context.SaveChangesAsync();
    
            var disciplines = new List<Discipline>();
            disciplines.Add(new Discipline { Name = "Автокад", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Автоматизація", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Архітектура та будівництво", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Будівельна механіка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Будівлі та споруди", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Вища математика", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Геодезія", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Геометрія", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Гідравліка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Деталі машин", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Дискретна математика", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Електроніка, електротехніка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Інженерна графіка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Математичний аналіз", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Матеріалознавство", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Машинобудування", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Метрологія", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Механіка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Нарисна геометрія", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Опір матеріалів", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Оптимізаційні методи та моделі", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Охорона праці", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Прикладна механіка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Радіотехніка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Робототехніка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Схемотехніка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Теоретична механіка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Теорія ігор", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Теорія ймовірності", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Теорія машин і механізмів", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Технічна механіка", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "ТОЕ", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Транспортні засоби", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Харчові технології", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Чисельні методи", DirectionId = dirТехнічні.Id });
            disciplines.Add(new Discipline { Name = "Авторське право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Аграрне право України", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Адвокатура", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Адміністративне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Банківське право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Військове право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Господарське право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Екологічне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Земельне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Інтелектуальна власність", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Інформаційне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Історія держави і права", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Конституційне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Криміналістика", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Кримінальне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Кримінальний процес", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Кримінологія", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Медичне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Митне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Міжнародне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Нотаріат", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Податкове право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Поліцейська діяльність", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Право\\Юриспруденція", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Правознавство", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Римське право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Сімейне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Теорія держави і права", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Торговельне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Трудове право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Філософія права", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Фінансове право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Цивільне право", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Цивільний процес", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Юридична деонтологія", DirectionId = dirПравові.Id });
            disciplines.Add(new Discipline { Name = "Агрономія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Алгебра", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Аналітична хімія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Астрономія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Атомна фізика", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Безпека життєдіяльності", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Біологія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Біотехнологія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Ботаніка", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Географія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Геологія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Зоологія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Математика", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Молекулярна фізика", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Неорганічна хімія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Органічна хімія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Поверхневі явища", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Природознавство", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Статистика", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Фізика", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Фізіологія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Хімія", DirectionId = dirПриродні.Id });
            disciplines.Add(new Discipline { Name = "Адміністративний менеджмент", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Аналіз господарської діяльності", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Банк і банківські операції", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Банківська система", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Банківська справа", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Бізнес інформатика", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Бізнес планування", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Бухгалтерія", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Бухгалтерський облік та аудит", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Бюджетні системи", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Готельний менеджмент", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Готельно-ресторанна справа", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Гроші, кредит, банки", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Економетрика", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Економіка", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Економіка митної справи", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Економіка підприємства", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Економіка праці", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Економіка туризму", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Економічна історія", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Економічна теорія", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Економічний аналіз", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Інвестиції", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Інвестиційний аналіз", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Інноваційний менеджмент", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Комерційна діяльність", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Контролінг підприємства", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Логістика", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Макроекономіка", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Макрофінансової аналіз", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Маркетинг", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Маркетингові дослідження", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Менеджмент", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Митна справа", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Міжнародна економіка", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Міжнародні відносини", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Мікроекономіка", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Організація виробництва", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Підприємництво", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Податкова система", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Політекономія", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Публічне управління та адміністрування", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Регіональна економіка", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Світова економіка", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Стратегічне управління", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Страхування", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Товарознавство", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Торгова справа", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Туризм", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Управління персоналом", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Управління проектами", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Фінанси", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Фінанси підприємств", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Фінансовий аналіз", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Фінансовий менеджмент", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Фінансовий ринок", DirectionId = dirЕкономічні.Id });
            disciplines.Add(new Discipline { Name = "Анатомія", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Біохімія", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Ветеринарія", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Генетика", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Екологія", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Медицина", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Мікробіологія", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Психодіагностика", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Стоматологія", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Фармакогнозія", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Фармакологія", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Фармація", DirectionId = dirМедичні.Id });
            disciplines.Add(new Discipline { Name = "Англійська", DirectionId = dirМови.Id });
            disciplines.Add(new Discipline { Name = "Іспанський", DirectionId = dirМови.Id });
            disciplines.Add(new Discipline { Name = "Латинська мова", DirectionId = dirМови.Id });
            disciplines.Add(new Discipline { Name = "Німецька", DirectionId = dirМови.Id });
            disciplines.Add(new Discipline { Name = "Польська мова", DirectionId = dirМови.Id });
            disciplines.Add(new Discipline { Name = "Російська мова", DirectionId = dirМови.Id });
            disciplines.Add(new Discipline { Name = "Українська мова", DirectionId = dirМови.Id });
            disciplines.Add(new Discipline { Name = "Французький", DirectionId = dirМови.Id });
            disciplines.Add(new Discipline { Name = "Антична філософія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Археологія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Біографія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Всесвітня історія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Геополітика", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Демографія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Деонтологія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Дизайн", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Діловодство", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Документознавство", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Естетика", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Етика", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Журналістика", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Зарубіжна література", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Захист України", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Історія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Історія архітектури", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Історія журналістики", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Історія психології", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Історія релігії", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Історія розвитку політичних вчень", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Історія середніх віків", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Історія України", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Конфліктологія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Кулінарія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Культурологія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Лінгвістика", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Література", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Логіка", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Логопедія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Мистецтво", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Мовознавство", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Музика", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Образотворче мистецтво", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Основи наукових досліджень", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Педагогіка", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Політологія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Психологія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Публіцистика", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Реклама та PR", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Релігія і міфологія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Соціальна робота", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Соціологія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Суспільствознавство", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Українська література", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Фізична культура", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Філологія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Філософія", DirectionId = dirГуманітарні.Id });
            disciplines.Add(new Discipline { Name = "Бази даних", DirectionId = dirКомпютерні.Id });
            disciplines.Add(new Discipline { Name = "Інформатика", DirectionId = dirКомпютерні.Id });
            disciplines.Add(new Discipline { Name = "Програмування", DirectionId = dirКомпютерні.Id });
            disciplines.Add(new Discipline { Name = "Інформаційна безпека", DirectionId = dirКомпютерні.Id });
            disciplines.Add(new Discipline { Name = "Інформаційні технології", DirectionId = dirКомпютерні.Id });
            disciplines.Add(new Discipline { Name = "Кібербезпека", DirectionId = dirКомпютерні.Id });
            disciplines.Add(new Discipline { Name = "Криптографія", DirectionId = dirКомпютерні.Id });
            disciplines.Add(new Discipline { Name = "Штучний інтелект", DirectionId = dirКомпютерні.Id });
            disciplines.Add(new Discipline { Name = "Excel", DirectionId = dirКомпютерні.Id });
            disciplines.Add(new Discipline { Name = "MathCad", DirectionId = dirКомпютерні.Id });
            disciplines.Add(new Discipline { Name = "MATLAB", DirectionId = dirКомпютерні.Id });
            context.Disciplines.AddRange(disciplines);
            await context.SaveChangesAsync();
    
        }

        if (await context.Users.AnyAsync()) return;

        // ==========================================
        // 1. СТВОРЕННЯ РОЛЕЙ
        // ==========================================
        string[] roles = { "Admin", "Client", "Executor" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // ==========================================
        // 2. СТВОРЕННЯ ЮЗЕРІВ
        // ==========================================
        
        // --- 2.1 Адмін ---
        var adminUser = new AppUser
        {
            UserName = "admin@upstudy.com",
            Email = "admin@upstudy.com",
            FirstName = "System",
            LastName = "Admin",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(adminUser, "Test1!");
        await userManager.AddToRoleAsync(adminUser, "Admin");

        // --- 2.2 Клієнт (Замовник) ---
        var clientUser = new AppUser
        {
            UserName = "client@test.com",
            Email = "client@test.com",
            FirstName = "Іван",
            LastName = "Клієнко",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(clientUser, "Test1!"); // Пароль
        await userManager.AddToRoleAsync(clientUser, "Client");

        // --- 2.3 Виконавець ---
        var executorUser = new AppUser
        {
            UserName = "dev@test.com",
            Email = "dev@test.com",
            FirstName = "Петро",
            LastName = "Кодер",
            EmailConfirmed = true,
            BankCardNumber = "4441111122223333", // Для тестів оплати
            IsFop = true,
            AboutMe = "Full-stack розробник, пишу на C# та JS."
        };
        await userManager.CreateAsync(executorUser, "Test1!");
        await userManager.AddToRoleAsync(executorUser, "Executor");

        // ==========================================
        // 3. ДОВІДНИКИ (Dictionaries)
        // ==========================================
        
        // Типи робіт
        var typeLab = new WorkType { Name = "Лабораторна робота" };
        var typeCourse = new WorkType { Name = "Курсова робота" };
        var typeDiploma = new WorkType { Name = "Диплом" };
        context.WorkTypes.AddRange(typeLab, typeCourse, typeDiploma);
        
        await context.SaveChangesAsync();

        // ==========================================
        // 4. ЗАМОВЛЕННЯ (Orders)
        // ==========================================

        // --- Замовлення 1: НОВЕ (чекає виконавця) ---
        var discCSharp = await context.Disciplines.FirstOrDefaultAsync(d => d.Name == "Програмування") ?? await context.Disciplines.FirstAsync();
        var discWeb = await context.Disciplines.FirstOrDefaultAsync(d => d.Name == "Інформаційні технології") ?? await context.Disciplines.FirstAsync();
        var discMicro = await context.Disciplines.FirstOrDefaultAsync(d => d.Name == "Мікроекономіка") ?? await context.Disciplines.FirstAsync();

        var orderNew = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Написати API для магазину",
            Description = "Потрібно зробити бекенд на ASP.NET Core. 3 контролери.",
            Price = 2000,
            ExecutorPrice = 1700,
            PlatformCommission = 300,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discCSharp.Id,
            WorkTypeId = typeCourse.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 2: В РОБОТІ (Виконавець вже взяв) ---
        var orderProgress = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Верстка сайту React",
            Description = "Адаптивна верстка за макетом Figma.",
            Price = 5000,
            ExecutorPrice = 4250,
            PlatformCommission = 750,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Status = OrderStatus.InProgress, // Вже в роботі
            ClientId = clientUser.Id,
            ExecutorId = executorUser.Id, // Виконавець призначений
            DisciplineId = discWeb.Id,
            WorkTypeId = typeLab.Id,
            IsCommissionPaid = true // Комісія оплачена
        };

        // --- Замовлення 3: НОВЕ ---
        var order3 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Розробка мобільного додатку (React Native)",
            Description = "Потрібно створити простий додаток для обліку витрат. Дизайн є.",
            Price = 4000,
            ExecutorPrice = 3400,
            PlatformCommission = 600,
            IsNegotiable = true,
            Deadline = DateTime.UtcNow.AddDays(14),
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discWeb.Id,
            WorkTypeId = typeCourse.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 4: НОВЕ ---
        var order4 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Дослідження ринку (Мікроекономіка)",
            Description = "Зробити аналіз ринку кави у Києві. 10 сторінок.",
            Price = 800,
            ExecutorPrice = 680,
            PlatformCommission = 120,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(5),
            CreatedAt = DateTime.UtcNow.AddHours(-10),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discMicro.Id,
            WorkTypeId = typeLab.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 5: НОВЕ ---
        var order5 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Telegram бот на C#",
            Description = "Бот для техпідтримки. Повинен приймати заявки та зберігати в БД.",
            Price = 1500,
            ExecutorPrice = 1275,
            PlatformCommission = 225,
            IsNegotiable = true,
            Deadline = DateTime.UtcNow.AddDays(10),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discCSharp.Id,
            WorkTypeId = typeLab.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 6: В РОБОТІ ---
        var order6 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Диплом з мікроекономіки",
            Description = "Тема: Вплив інфляції на малий бізнес. 60 сторінок.",
            Price = 12000,
            ExecutorPrice = 10200,
            PlatformCommission = 1800,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            Status = OrderStatus.InProgress,
            ClientId = clientUser.Id,
            ExecutorId = executorUser.Id,
            DisciplineId = discMicro.Id,
            WorkTypeId = typeDiploma.Id,
            IsCommissionPaid = true
        };

        // --- Замовлення 7: НОВЕ ---
        var order7 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Створення лендінгу (HTML/CSS/JS)",
            Description = "Верстка односторінкового сайту для барбершопу.",
            Price = 2500,
            ExecutorPrice = 2125,
            PlatformCommission = 375,
            IsNegotiable = true,
            Deadline = DateTime.UtcNow.AddDays(4),
            CreatedAt = DateTime.UtcNow.AddHours(-2),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discWeb.Id,
            WorkTypeId = typeLab.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 8: ВИКОНАНО ---
        var order8 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Калькулятор на C# (Windows Forms)",
            Description = "Простий калькулятор, 4 дії + корінь.",
            Price = 500,
            ExecutorPrice = 425,
            PlatformCommission = 75,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            Status = OrderStatus.Completed,
            ClientId = clientUser.Id,
            ExecutorId = executorUser.Id,
            DisciplineId = discCSharp.Id,
            WorkTypeId = typeLab.Id,
            IsCommissionPaid = true
        };

        // --- Замовлення 9: НОВЕ ---
        var order9 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Парсер новин на C#",
            Description = "Потрібно зібрати заголовки з 3 сайтів і зберегти в CSV.",
            Price = 1800,
            ExecutorPrice = 1530,
            PlatformCommission = 270,
            IsNegotiable = true,
            Deadline = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discCSharp.Id,
            WorkTypeId = typeCourse.Id,
            IsCommissionPaid = false
        };

        // --- Замовлення 10: НОВЕ ---
        var order10 = new Order
        {
            Id = Guid.NewGuid(),
            Title = "Курсова робота з Web-технологій",
            Description = "Розробка блогу на Next.js + TailwindCSS. Звіт + код.",
            Price = 3500,
            ExecutorPrice = 2975,
            PlatformCommission = 525,
            IsNegotiable = false,
            Deadline = DateTime.UtcNow.AddDays(20),
            CreatedAt = DateTime.UtcNow.AddHours(-1),
            Status = OrderStatus.New,
            ClientId = clientUser.Id,
            DisciplineId = discWeb.Id,
            WorkTypeId = typeCourse.Id,
            IsCommissionPaid = false
        };

        context.Orders.AddRange(orderNew, orderProgress, order3, order4, order5, order6, order7, order8, order9, order10);
        await context.SaveChangesAsync();

        // ==========================================
        // 5. ЧАТ ТА ПОВІДОМЛЕННЯ
        // ==========================================
        
        // Створюємо чат для замовлення "В роботі"
        var chat = new Chat { OrderId = orderProgress.Id };
        context.Chats.Add(chat);
        await context.SaveChangesAsync();

        var msg1 = new ChatMessage
        {
            ChatId = chat.Id,
            SenderId = clientUser.Id,
            Text = "Привіт! Коли зможеш почати?",
            SentAt = DateTime.UtcNow.AddHours(-5)
        };

        var msg2 = new ChatMessage
        {
            ChatId = chat.Id,
            SenderId = executorUser.Id,
            Text = "Вже почав, завтра скину перші напрацювання.",
            SentAt = DateTime.UtcNow.AddHours(-4)
        };

        context.ChatMessages.AddRange(msg1, msg2);

        // ==========================================
        // 6. СТАВКИ (Proposals)
        // ==========================================
        
        // Виконавець робить ставку на НОВЕ замовлення
        var proposal = new OrderProposal
        {
            OrderId = orderNew.Id,
            ExecutorId = executorUser.Id,
            Price = 2000,
            Comment = "Зроблю швидко і якісно. Є досвід з .NET.",
            Status = ProposalStatus.Pending
        };
        context.OrderProposals.Add(proposal);

        await context.SaveChangesAsync();
    }
}